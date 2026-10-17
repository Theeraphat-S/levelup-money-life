import type { Account, AccountType, Transaction, Transfer } from "../types";

export const DEFAULT_ACCOUNT_ID = "acc-main";

export function createDefaultAccount(name: string, createdAt = new Date().toISOString().slice(0, 10)): Account {
  return { id: DEFAULT_ACCOUNT_ID, name, type: "bank", openingBalance: 0, archived: false, createdAt };
}

/** Guarantees at least one active account so every transaction has somewhere to live. */
export function ensureAccounts(accounts: Account[] | undefined, defaultName: string): Account[] {
  const list = Array.isArray(accounts) ? accounts.filter(isValidAccount) : [];
  if (list.some((a) => !a.archived)) return list;
  const existingDefault = list.find((a) => a.id === DEFAULT_ACCOUNT_ID);
  if (existingDefault) return list.map((a) => (a.id === DEFAULT_ACCOUNT_ID ? { ...a, archived: false } : a));
  return [createDefaultAccount(defaultName), ...list];
}

function isValidAccount(value: unknown): value is Account {
  const a = value as Account;
  return Boolean(a && typeof a.id === "string" && typeof a.name === "string" && Number.isFinite(a.openingBalance));
}

/** Picks the account new entries go to: the preferred one if still active, else the first active. */
export function resolveDefaultAccountId(accounts: Account[], preferredId?: string): string {
  const active = accounts.filter((a) => !a.archived);
  if (preferredId && active.some((a) => a.id === preferredId)) return preferredId;
  return active[0]?.id ?? DEFAULT_ACCOUNT_ID;
}

/** Assigns legacy or orphaned transactions to the fallback account. Returns the same array when nothing changes. */
export function assignMissingAccounts(transactions: Transaction[], accounts: Account[], fallbackId: string): Transaction[] {
  const known = new Set(accounts.map((a) => a.id));
  let changed = false;
  const next = transactions.map((tx) => {
    if (tx.accountId && known.has(tx.accountId)) return tx;
    changed = true;
    return { ...tx, accountId: fallbackId };
  });
  return changed ? next : transactions;
}

/** Balances per account; with `asOf` (YYYY-MM-DD) only entries on or before that date count. */
export function computeAccountBalances(
  accounts: Account[],
  transactions: Transaction[],
  transfers: Transfer[],
  asOf?: string
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const account of accounts) balances[account.id] = account.openingBalance;
  for (const tx of transactions) {
    if (asOf && tx.date > asOf) continue;
    const id = tx.accountId ?? DEFAULT_ACCOUNT_ID;
    if (id in balances) balances[id] += tx.amount;
    if (tx.counterAccountId && tx.counterAccountId !== id && tx.counterAccountId in balances) {
      balances[tx.counterAccountId] -= tx.amount;
    }
  }
  for (const transfer of transfers) {
    if (asOf && transfer.date > asOf) continue;
    if (transfer.fromAccountId in balances) balances[transfer.fromAccountId] -= transfer.amount;
    if (transfer.toAccountId in balances) balances[transfer.toAccountId] += transfer.amount;
  }
  for (const id of Object.keys(balances)) balances[id] = Math.round(balances[id] * 100) / 100;
  return balances;
}

/** Sum of every account balance; credit card debt is negative so it reduces the total. */
export function computeNetWorth(balances: Record<string, number>): number {
  return Math.round(Object.values(balances).reduce((sum, value) => sum + value, 0) * 100) / 100;
}

export type TransferError = "sameAccount" | "invalidAmount" | "unknownAccount";

export function validateTransfer(transfer: Omit<Transfer, "id">, accounts: Account[]): TransferError | null {
  if (transfer.fromAccountId === transfer.toAccountId) return "sameAccount";
  if (!Number.isFinite(transfer.amount) || transfer.amount <= 0) return "invalidAmount";
  const active = new Set(accounts.filter((a) => !a.archived).map((a) => a.id));
  if (!active.has(transfer.fromAccountId) || !active.has(transfer.toAccountId)) return "unknownAccount";
  return null;
}

export function isAccountReferenced(accountId: string, transactions: Transaction[], transfers: Transfer[]): boolean {
  return (
    transactions.some((tx) => (tx.accountId ?? DEFAULT_ACCOUNT_ID) === accountId || tx.counterAccountId === accountId) ||
    transfers.some((t) => t.fromAccountId === accountId || t.toAccountId === accountId)
  );
}

export function normalizeAlias(alias: string | undefined): string | undefined {
  const clean = alias?.trim().toLowerCase().replace(/^@/, "").replace(/\s+/g, "");
  return clean ? clean : undefined;
}

export function isAliasTaken(alias: string | undefined, accounts: Account[], exceptId?: string): boolean {
  const clean = normalizeAlias(alias);
  if (!clean) return false;
  return accounts.some((a) => a.id !== exceptId && normalizeAlias(a.alias) === clean);
}

export function sanitizeTransfers(transfers: unknown): Transfer[] {
  if (!Array.isArray(transfers)) return [];
  return transfers.filter((t): t is Transfer => {
    const v = t as Transfer;
    return Boolean(
      v && typeof v.id === "string" && typeof v.fromAccountId === "string" && typeof v.toAccountId === "string" &&
      typeof v.date === "string" && Number.isFinite(v.amount) && v.amount > 0
    );
  });
}

export const ACCOUNT_TYPE_ORDER: Record<AccountType, number> = { cash: 0, bank: 1, ewallet: 2, credit: 3 };

export type AccountSnapshot = {
  accounts: Account[];
  transfers: Transfer[];
  defaultAccountId: string;
};

/**
 * Merges a backup into account state. Backups older than 5.0.0 carry no accounts, so the
 * current accounts are kept and their transactions are moved into the default account.
 */
export function restoreAccountSnapshot(
  backup: { transactions: Transaction[]; accounts?: Account[]; transfers?: Transfer[]; defaultAccountId?: string },
  current: AccountSnapshot,
  defaultName: string
): AccountSnapshot & { transactions: Transaction[] } {
  const hasAccounts = Array.isArray(backup.accounts);
  const accounts = ensureAccounts(hasAccounts ? backup.accounts : current.accounts, defaultName);
  const known = new Set(accounts.map((a) => a.id));
  const transfers = (hasAccounts ? sanitizeTransfers(backup.transfers) : current.transfers).filter(
    (t) => known.has(t.fromAccountId) && known.has(t.toAccountId)
  );
  const defaultAccountId = resolveDefaultAccountId(accounts, backup.defaultAccountId ?? current.defaultAccountId);
  return { accounts, transfers, defaultAccountId, transactions: assignMissingAccounts(backup.transactions, accounts, defaultAccountId) };
}

// Keywords per provider, matched against the slip's detected bank and the user's account names/aliases
const BANK_KEYWORDS: string[][] = [
  ["kbank", "kasikorn", "กสิกร", "k plus", "kplus"],
  ["scb", "ไทยพาณิชย์"],
  ["ktb", "krungthai", "กรุงไทย"],
  ["bbl", "bangkok bank", "กรุงเทพ", "bualuang", "บัวหลวง"],
  ["krungsri", "กรุงศรี"],
  ["gsb", "ออมสิน", "mymo"],
  ["ttb", "ทีทีบี", "ทหารไทย", "ธนชาต"],
  ["truemoney", "ทรูมันนี่"],
  ["shopeepay", "ช้อปปี้เพย์"],
  ["line pay", "linepay", "ไลน์เพย์"],
];

/** Guesses which of the user's non-card accounts paid an outgoing slip from the detected bank name. */
export function guessAccountForBank(bankName: string | undefined, accounts: Account[]): string | undefined {
  if (!bankName) return undefined;
  const detected = bankName.toLowerCase();
  const group = BANK_KEYWORDS.find((keywords) => keywords.some((kw) => detected.includes(kw)));
  if (!group) return undefined;
  const match = accounts.find((account) => {
    if (account.archived || account.type === "credit") return false;
    const name = account.name.toLowerCase();
    const alias = normalizeAlias(account.alias);
    return group.some((kw) => name.includes(kw) || alias === kw.replace(/\s+/g, ""));
  });
  return match?.id;
}

/**
 * Balance after each entry of one account, in date order (same-day entries keep the order they
 * were logged; lists are stored newest first). Keys are "tx:<id>" and "tr:<id>".
 */
export function runningBalances(account: Account, transactions: Transaction[], transfers: Transfer[]): Record<string, number> {
  type Entry = { key: string; date: string; order: number; delta: number };
  const entries: Entry[] = [];
  transactions.forEach((tx, index) => {
    const own = (tx.accountId ?? DEFAULT_ACCOUNT_ID) === account.id;
    const counter = tx.counterAccountId === account.id && !own;
    if (own) entries.push({ key: `tx:${tx.id}`, date: tx.date, order: -index, delta: tx.amount });
    else if (counter) entries.push({ key: `tx:${tx.id}`, date: tx.date, order: -index, delta: -tx.amount });
  });
  transfers.forEach((transfer, index) => {
    if (transfer.fromAccountId === account.id) entries.push({ key: `tr:${transfer.id}`, date: transfer.date, order: -index - 0.5, delta: -transfer.amount });
    else if (transfer.toAccountId === account.id) entries.push({ key: `tr:${transfer.id}`, date: transfer.date, order: -index - 0.5, delta: transfer.amount });
  });
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  const result: Record<string, number> = {};
  let balance = account.openingBalance;
  for (const entry of entries) {
    balance = Math.round((balance + entry.delta) * 100) / 100;
    result[entry.key] = balance;
  }
  return result;
}
