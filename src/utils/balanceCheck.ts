import type { Account, Transaction } from "../types";

export const UNACCOUNTED_CATEGORY = "Unaccounted";

export type SplitLine = { name: string; amount: number; category: string };

export type BalanceCheckInput = {
  account: Account;
  recordedBalance: number;
  actualBalance: number; // Credit cards: negative of what is owed
  date: string;
  splits?: SplitLine[]; // Explain part of a shortfall as known spending
  labels: { unaccounted: string; adjustment: string };
};

export type BalanceCheckResult =
  | { ok: true; difference: number; transactions: Transaction[] }
  | { ok: false; error: "splitsExceedDifference" | "invalidSplit" | "invalidBalance" };

const round = (value: number) => Math.round(value * 100) / 100;

/** Positive when the real balance is higher than the app thinks, negative when money went missing. */
export function balanceDifference(recordedBalance: number, actualBalance: number): number {
  return round(actualBalance - recordedBalance);
}

/**
 * Turns a balance check into entries on that account: a shortfall becomes the split spending
 * plus an "Unaccounted" expense for whatever is left; a surplus becomes one adjustment income.
 */
export function buildBalanceAdjustment(input: BalanceCheckInput): BalanceCheckResult {
  if (!Number.isFinite(input.actualBalance)) return { ok: false, error: "invalidBalance" };
  const difference = balanceDifference(input.recordedBalance, input.actualBalance);
  const base = { date: input.date, cleared: true, accountId: input.account.id };
  if (difference === 0) return { ok: true, difference, transactions: [] };

  if (difference > 0) {
    return {
      ok: true,
      difference,
      transactions: [{ ...base, id: crypto.randomUUID(), name: input.labels.adjustment, amount: difference, category: "Income" }],
    };
  }

  const splits = (input.splits ?? []).filter((s) => s.name.trim() || s.amount);
  if (splits.some((s) => !s.name.trim() || !Number.isFinite(s.amount) || s.amount <= 0)) {
    return { ok: false, error: "invalidSplit" };
  }
  const explained = round(splits.reduce((sum, s) => sum + s.amount, 0));
  const missing = round(-difference);
  if (explained > missing) return { ok: false, error: "splitsExceedDifference" };

  const transactions: Transaction[] = splits.map((s) => ({
    ...base,
    id: crypto.randomUUID(),
    name: s.name.trim(),
    amount: -round(s.amount),
    category: s.category,
  }));
  const remainder = round(missing - explained);
  if (remainder > 0) {
    transactions.push({ ...base, id: crypto.randomUUID(), name: input.labels.unaccounted, amount: -remainder, category: UNACCOUNTED_CATEGORY });
  }
  return { ok: true, difference, transactions };
}

/** Total recorded as "Unaccounted" in a month, shown separately in Analytics. */
export function unaccountedTotal(transactions: Transaction[], month: string): number {
  return round(
    transactions
      .filter((tx) => tx.category === UNACCOUNTED_CATEGORY && tx.date.startsWith(month))
      .reduce((sum, tx) => sum - tx.amount, 0)
  );
}
