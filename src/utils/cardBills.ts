import type { Account, Transaction, Transfer } from "../types";
import { computeAccountBalances } from "./accounts";
import { getDaysInMonth } from "./dates";

export type CardBillOccurrence = {
  account: Account;
  statementDate: string;
  dueDate: string;
  statementAmount: number; // Owed on the statement date
  paidAmount: number; // Transfers into the card after the statement, before the next one
  remaining: number;
  overdue: boolean;
};

function dateInMonth(year: number, month: number, day: number): string {
  const normalizedYear = year + Math.floor((month - 1) / 12);
  const normalizedMonth = ((month - 1) % 12 + 12) % 12 + 1;
  const clamped = Math.min(day, getDaysInMonth(normalizedYear, normalizedMonth));
  return `${normalizedYear}-${String(normalizedMonth).padStart(2, "0")}-${String(clamped).padStart(2, "0")}`;
}

/**
 * The card bill due in `activeMonth`: due on dueDay of that month, for the latest statement
 * cut before it. Card swipes were already counted as spending, so paying this bill is a
 * transfer and never touches Safe-to-Spend.
 */
export function getCardBillForMonth(
  account: Account,
  activeMonth: string,
  today: string,
  transactions: Transaction[],
  transfers: Transfer[]
): CardBillOccurrence | null {
  if (account.type !== "credit" || account.archived || !account.statementDay || !account.dueDay) return null;
  const [year, month] = activeMonth.split("-").map(Number);
  const dueDate = dateInMonth(year, month, account.dueDay);
  let statementDate = dateInMonth(year, month, account.statementDay);
  let statementMonthOffset = 0;
  if (statementDate >= dueDate) {
    statementMonthOffset = -1;
    statementDate = dateInMonth(year, month - 1, account.statementDay);
  }
  // Balances before the account existed are unknown, so skip cycles cut before it was added
  if (statementDate < account.createdAt) return null;

  const nextStatementDate = dateInMonth(year, month + statementMonthOffset + 1, account.statementDay);
  const balance = computeAccountBalances([account], transactions, transfers, statementDate)[account.id] ?? 0;
  const statementAmount = Math.max(0, Math.round(-balance * 100) / 100);
  if (statementAmount <= 0) return null;

  const paidAmount = Math.round(
    transfers
      .filter((t) => t.toAccountId === account.id && t.date > statementDate && t.date <= nextStatementDate)
      .reduce((sum, t) => sum + t.amount, 0) * 100
  ) / 100;
  const remaining = Math.max(0, Math.round((statementAmount - paidAmount) * 100) / 100);
  return { account, statementDate, dueDate, statementAmount, paidAmount, remaining, overdue: remaining > 0 && dueDate < today };
}

export function getCardBills(
  accounts: Account[],
  activeMonth: string,
  today: string,
  transactions: Transaction[],
  transfers: Transfer[]
): CardBillOccurrence[] {
  return accounts
    .map((account) => getCardBillForMonth(account, activeMonth, today, transactions, transfers))
    .filter((bill): bill is CardBillOccurrence => bill !== null)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
