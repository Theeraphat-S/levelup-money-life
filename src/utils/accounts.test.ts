import { describe, expect, it } from "vitest";
import type { Account, Transaction, Transfer } from "../types";
import {
  DEFAULT_ACCOUNT_ID,
  assignMissingAccounts,
  computeAccountBalances,
  computeNetWorth,
  guessAccountForBank,
  ensureAccounts,
  isAccountReferenced,
  isAliasTaken,
  resolveDefaultAccountId,
  restoreAccountSnapshot,
  runningBalances,
  sanitizeTransfers,
  validateTransfer,
} from "./accounts";

const bank: Account = { id: "kb", name: "KBank", type: "bank", openingBalance: 10000, archived: false, createdAt: "2026-10-01" };
const card: Account = { id: "card", name: "Card", type: "credit", openingBalance: -2000, alias: "card", archived: false, createdAt: "2026-10-01" };

const tx = (id: string, amount: number, accountId?: string): Transaction => ({
  id, name: id, amount, date: "2026-10-05", category: amount > 0 ? "Income" : "Food", cleared: true, accountId,
});

describe("accounts", () => {
  it("creates a default account when none exist and keeps existing ones", () => {
    expect(ensureAccounts(undefined, "Main")).toEqual([expect.objectContaining({ id: DEFAULT_ACCOUNT_ID, name: "Main" })]);
    expect(ensureAccounts([bank], "Main")).toEqual([bank]);
  });

  it("revives the default account when every account is archived", () => {
    const archivedDefault = { ...bank, id: DEFAULT_ACCOUNT_ID, archived: true };
    expect(ensureAccounts([archivedDefault], "Main")[0].archived).toBe(false);
  });

  it("assigns legacy and orphaned transactions to the fallback account", () => {
    const rows = [tx("legacy", -50), tx("orphan", -20, "gone"), tx("ok", -10, "kb")];
    const result = assignMissingAccounts(rows, [bank], "kb");
    expect(result.map((r) => r.accountId)).toEqual(["kb", "kb", "kb"]);
    expect(result[2]).toBe(rows[2]);
  });

  it("returns the same array when nothing needs assignment", () => {
    const rows = [tx("ok", -10, "kb")];
    expect(assignMissingAccounts(rows, [bank], "kb")).toBe(rows);
  });

  it("derives balances from opening balance, transactions and transfers", () => {
    const transfers: Transfer[] = [{ id: "t1", fromAccountId: "kb", toAccountId: "card", amount: 1500, date: "2026-10-06" }];
    const balances = computeAccountBalances(
      [bank, card],
      [tx("salary", 30000, "kb"), tx("lunch", -70, "card"), tx("coffee", -60.5, "kb")],
      transfers
    );
    expect(balances).toEqual({ kb: 38439.5, card: -570 });
    expect(computeNetWorth(balances)).toBe(37869.5);
  });

  it("counts legacy rows without accountId toward the default account", () => {
    const main = { ...bank, id: DEFAULT_ACCOUNT_ID, openingBalance: 0 };
    expect(computeAccountBalances([main], [tx("legacy", -100)], [])[DEFAULT_ACCOUNT_ID]).toBe(-100);
  });

  it("moves linked savings deposits into the goal account without changing net worth", () => {
    const savings: Account = { ...bank, id: "sav", name: "Savings", openingBalance: 0 };
    const deposit: Transaction = { ...tx("goal", -1000, "kb"), category: "Savings", counterAccountId: "sav" };
    const withdraw: Transaction = { ...tx("back", 200, "kb"), category: "Savings", counterAccountId: "sav" };
    const balances = computeAccountBalances([bank, savings], [deposit, withdraw], []);
    expect(balances).toEqual({ kb: 9200, sav: 800 });
    expect(computeNetWorth(balances)).toBe(10000);
  });

  it("transfers never change net worth", () => {
    const before = computeNetWorth(computeAccountBalances([bank, card], [], []));
    const after = computeNetWorth(computeAccountBalances([bank, card], [], [
      { id: "t", fromAccountId: "kb", toAccountId: "card", amount: 999, date: "2026-10-06" },
    ]));
    expect(after).toBe(before);
  });

  it("validates transfers", () => {
    const base = { fromAccountId: "kb", toAccountId: "card", amount: 100, date: "2026-10-06" };
    expect(validateTransfer(base, [bank, card])).toBeNull();
    expect(validateTransfer({ ...base, toAccountId: "kb" }, [bank, card])).toBe("sameAccount");
    expect(validateTransfer({ ...base, amount: 0 }, [bank, card])).toBe("invalidAmount");
    expect(validateTransfer(base, [bank, { ...card, archived: true }])).toBe("unknownAccount");
  });

  it("falls back to the first active account when the preferred one is archived", () => {
    expect(resolveDefaultAccountId([{ ...bank, archived: true }, card], "kb")).toBe("card");
    expect(resolveDefaultAccountId([bank, card], "card")).toBe("card");
  });

  it("detects references and alias clashes", () => {
    expect(isAccountReferenced("card", [tx("a", -1, "kb")], [])).toBe(false);
    expect(isAccountReferenced("card", [], [{ id: "t", fromAccountId: "kb", toAccountId: "card", amount: 1, date: "2026-10-01" }])).toBe(true);
    expect(isAliasTaken("@Card", [bank, card])).toBe(true);
    expect(isAliasTaken("card", [bank, card], "card")).toBe(false);
  });

  it("drops malformed transfers from untrusted input", () => {
    expect(sanitizeTransfers([{ id: "x", fromAccountId: "a", toAccountId: "b", amount: -5, date: "2026-10-01" }, null])).toEqual([]);
    expect(sanitizeTransfers("nope")).toEqual([]);
  });
});

describe("restoring backups", () => {
  const current = { accounts: [bank, card], transfers: [], defaultAccountId: "kb" };

  it("moves transactions from pre-accounts backups into the current default account", () => {
    const result = restoreAccountSnapshot({ transactions: [tx("old", -40)] }, current, "Main");
    expect(result.accounts).toEqual([bank, card]);
    expect(result.transactions[0].accountId).toBe("kb");
  });

  it("uses accounts from new backups and drops transfers to unknown accounts", () => {
    const result = restoreAccountSnapshot({
      transactions: [tx("a", -1, "card"), tx("b", -1, "missing")],
      accounts: [card],
      transfers: [{ id: "t", fromAccountId: "kb", toAccountId: "card", amount: 5, date: "2026-10-01" }],
      defaultAccountId: "card",
    }, current, "Main");
    expect(result.accounts).toEqual([card]);
    expect(result.transfers).toEqual([]);
    expect(result.defaultAccountId).toBe("card");
    expect(result.transactions.map((t) => t.accountId)).toEqual(["card", "card"]);
  });
});

describe("guessing the account from a slip", () => {
  const kbank: Account = { id: "k", name: "กสิกร ออมทรัพย์", type: "bank", openingBalance: 0, archived: false, createdAt: "2026-10-01" };
  const scb: Account = { id: "s", name: "Salary", alias: "scb", type: "bank", openingBalance: 0, archived: false, createdAt: "2026-10-01" };
  const scbCard: Account = { id: "c", name: "SCB Card", type: "credit", openingBalance: 0, archived: false, createdAt: "2026-10-01" };

  it("matches by account name or alias", () => {
    expect(guessAccountForBank("Kasikornbank (กสิกรไทย)", [scb, kbank])).toBe("k");
    expect(guessAccountForBank("SCB (ไทยพาณิชย์)", [scbCard, kbank, scb])).toBe("s");
  });

  it("returns nothing for unknown providers or when no account matches", () => {
    expect(guessAccountForBank("PromptPay (พร้อมเพย์)", [kbank, scb])).toBeUndefined();
    expect(guessAccountForBank("Krungthai Bank (กรุงไทย)", [kbank, scb])).toBeUndefined();
    expect(guessAccountForBank(undefined, [kbank])).toBeUndefined();
  });
});

describe("running balance", () => {
  it("accumulates one account's entries in date order, oldest logged first on the same day", () => {
    // Stored newest first, like the app keeps them
    const rows = [tx("lunch", -70, "kb"), tx("salary", 30000, "kb"), { ...tx("old", -500, "kb"), date: "2026-10-01" }, tx("other", -5, "card")];
    const transfers: Transfer[] = [{ id: "pay", fromAccountId: "kb", toAccountId: "card", amount: 1000, date: "2026-10-03" }];
    expect(runningBalances(bank, rows, transfers)).toEqual({
      "tx:old": 9500,
      "tr:pay": 8500,
      "tx:salary": 38500,
      "tx:lunch": 38430,
    });
  });
});
