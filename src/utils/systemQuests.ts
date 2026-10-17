import type { Account, Transaction } from "../types";
import { computeCategoryBudgets, type CategoryDef } from "./categories";

// Quests the app judges from real data; the user cannot tick them by hand.
export const WEEKLY_CHECK_XP = 30;
export const MONTH_LIMITS_XP = 100;

export type SystemQuestAwards = {
  weeklyCheck?: string; // ISO week already rewarded, e.g. "2026-W42"
  monthLimits?: string; // Month already rewarded, e.g. "2026-09"
};

export type SystemQuestAward = { id: "weeklyCheck" | "monthLimits"; xp: number; period: string };

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ISO-8601 week key ("2026-W42"); weeks start on Monday. */
export function isoWeekKey(iso: string): string {
  const date = parseDate(iso);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day); // Thursday decides the week's year
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekStart(iso: string): string {
  const date = parseDate(iso);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (day - 1));
  return formatDate(date);
}

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export type WeeklyCheckStatus = { done: boolean; period: string; checked: number; total: number };

/** Done once any active account was compared with its real balance since Monday. */
export function weeklyBalanceCheckStatus(accounts: Account[], today: string): WeeklyCheckStatus {
  const active = accounts.filter((a) => !a.archived);
  const from = weekStart(today);
  const checked = active.filter((a) => a.lastBalanceCheck && a.lastBalanceCheck >= from && a.lastBalanceCheck <= today).length;
  return { done: checked > 0, period: isoWeekKey(today), checked, total: active.length };
}

export type MonthLimitsStatus = { month: string; hasLimits: boolean; hasSpending: boolean; overCount: number; ok: boolean };

/**
 * Uses today's limits, since limits are not versioned per month. To avoid rewarding months
 * before limits were in use, at least one limited category must have spending that month.
 */
export function monthWithinLimitsStatus(categories: CategoryDef[], transactions: Transaction[], month: string): MonthLimitsStatus {
  const statuses = computeCategoryBudgets(categories, transactions, month);
  const overCount = statuses.filter((s) => s.level === "over").length;
  const hasLimits = statuses.length > 0;
  const hasSpending = statuses.some((s) => s.spent > 0);
  return { month, hasLimits, hasSpending, overCount, ok: hasLimits && hasSpending && overCount === 0 };
}

/**
 * Rewards that became due: this week's balance check, and the month that just ended without
 * any category going over its limit. Each period is rewarded once.
 */
export function dueSystemAwards(
  awarded: SystemQuestAwards,
  accounts: Account[],
  categories: CategoryDef[],
  transactions: Transaction[],
  today: string
): { awards: SystemQuestAward[]; next: SystemQuestAwards } {
  const awards: SystemQuestAward[] = [];
  const next = { ...awarded };

  const weekly = weeklyBalanceCheckStatus(accounts, today);
  if (weekly.done && awarded.weeklyCheck !== weekly.period) {
    awards.push({ id: "weeklyCheck", xp: WEEKLY_CHECK_XP, period: weekly.period });
    next.weeklyCheck = weekly.period;
  }

  const lastMonth = previousMonth(today.slice(0, 7));
  if (!awarded.monthLimits || awarded.monthLimits < lastMonth) {
    const status = monthWithinLimitsStatus(categories, transactions, lastMonth);
    if (status.ok) {
      awards.push({ id: "monthLimits", xp: MONTH_LIMITS_XP, period: lastMonth });
      next.monthLimits = lastMonth;
    }
  }

  return { awards, next };
}
