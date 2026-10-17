import type { BudgetBucket, Transaction } from "../types";
import { normalizeIconKey } from "./iconKeys";

export type CategoryDef = {
  id: string;
  name?: string; // Custom categories only; built-ins are translated via `category.<id>`
  icon: string; // Icon key from components/icons/registry
  color: string;
  bucket: BudgetBucket | null; // null only for Income
  builtIn: boolean;
  hidden: boolean;
  monthlyLimit?: number; // Spending cap per month; undefined = no limit
};

// Every colour keeps ≥ 3:1 contrast on both the light (#FEFFFC) and dark (#0D2927) surfaces
export const CATEGORY_PALETTE = [
  "#3F8A6E", "#B5822F", "#3F7DB5", "#6F8A45", "#C0577F", "#7466C2", "#C96A2E",
  "#B05D58", "#2A8C8C", "#9A7048", "#4E9A47", "#A055A8", "#62808C", "#A88A1F",
] as const;

export const BUILT_IN_CATEGORIES: CategoryDef[] = [
  { id: "Income", icon: "coins", color: "#3F8A6E", bucket: null, builtIn: true, hidden: false },
  { id: "Food", icon: "meal", color: "#B5822F", bucket: "Needs", builtIn: true, hidden: false },
  { id: "Transport", icon: "transit", color: "#3F7DB5", bucket: "Needs", builtIn: true, hidden: false },
  { id: "Home", icon: "home", color: "#6F8A45", bucket: "Needs", builtIn: true, hidden: false },
  { id: "Health", icon: "health", color: "#C0577F", bucket: "Needs", builtIn: true, hidden: false },
  { id: "Learning", icon: "learning", color: "#7466C2", bucket: "Wants", builtIn: true, hidden: false },
  { id: "Fun", icon: "game", color: "#C96A2E", bucket: "Wants", builtIn: true, hidden: false },
  { id: "Debt", icon: "card", color: "#B05D58", bucket: "Savings", builtIn: true, hidden: false },
  { id: "Savings", icon: "savings", color: "#2A8C8C", bucket: "Savings", builtIn: true, hidden: false },
  // Filled in by balance checks, so it stays out of pickers unless the user shows it
  { id: "Unaccounted", icon: "question", color: "#62808C", bucket: "Wants", builtIn: true, hidden: true },
];

// Income and Savings drive core metrics, so they cannot be hidden, re-bucketed or capped
export const LOCKED_CATEGORY_IDS: ReadonlySet<string> = new Set(["Income", "Savings"]);

const BUCKETS: BudgetBucket[] = ["Needs", "Wants", "Savings"];
const FALLBACK_COLOR = "#62808C";

function isBucket(value: unknown): value is BudgetBucket {
  return BUCKETS.includes(value as BudgetBucket);
}

function sanitizeCategory(value: unknown): CategoryDef | null {
  const c = value as CategoryDef;
  if (!c || typeof c.id !== "string" || !c.id) return null;
  const limit = Number(c.monthlyLimit);
  return {
    id: c.id,
    ...(typeof c.name === "string" && c.name.trim() ? { name: c.name.trim() } : {}),
    icon: normalizeIconKey(c.icon), // also maps Phosphor names saved by older versions
    color: typeof c.color === "string" && /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : FALLBACK_COLOR,
    bucket: isBucket(c.bucket) ? c.bucket : "Wants",
    builtIn: false,
    hidden: Boolean(c.hidden),
    ...(Number.isFinite(limit) && limit > 0 ? { monthlyLimit: limit } : {}),
  };
}

/**
 * Combines stored categories with the built-ins: built-ins always exist (user tweaks to colour,
 * icon, bucket, visibility and limit are kept), custom categories follow in their stored order.
 */
export function mergeWithBuiltIns(stored: unknown): CategoryDef[] {
  const list = Array.isArray(stored) ? stored.map(sanitizeCategory).filter((c): c is CategoryDef => c !== null) : [];
  const byId = new Map(list.map((c) => [c.id, c]));
  const builtIns = BUILT_IN_CATEGORIES.map((base) => {
    const saved = byId.get(base.id);
    if (!saved) return base;
    const locked = LOCKED_CATEGORY_IDS.has(base.id);
    return {
      ...base,
      icon: saved.icon,
      color: saved.color,
      bucket: locked ? base.bucket : saved.bucket,
      hidden: locked ? false : saved.hidden,
      ...(!locked && saved.monthlyLimit ? { monthlyLimit: saved.monthlyLimit } : {}),
    };
  });
  const builtInIds = new Set(BUILT_IN_CATEGORIES.map((c) => c.id));
  const custom = list.filter((c) => !builtInIds.has(c.id) && c.name);
  return [...builtIns, ...custom];
}

/** Looks a category up; unknown ids (e.g. from an old CSV) still render with a neutral style. */
export function findCategory(list: CategoryDef[], id: string): CategoryDef {
  return list.find((c) => c.id === id) ?? { id, name: id, icon: "tag", color: FALLBACK_COLOR, bucket: "Wants", builtIn: false, hidden: false };
}

export function bucketForCategory(list: CategoryDef[], id: string): BudgetBucket {
  return findCategory(list, id).bucket ?? "Wants";
}

/** Expense category ids for pickers; `keep` stays listed even when hidden (e.g. a row's current value). */
export function expenseCategoryIds(list: CategoryDef[], options: { includeHidden?: boolean; keep?: string; excludeSavings?: boolean } = {}): string[] {
  return list
    .filter((c) => c.id !== "Income")
    .filter((c) => !(options.excludeSavings && c.id === "Savings"))
    .filter((c) => options.includeHidden || !c.hidden || c.id === options.keep)
    .map((c) => c.id);
}

export function nextCategoryColor(list: CategoryDef[]): string {
  const used = new Set(list.map((c) => c.color.toLowerCase()));
  return CATEGORY_PALETTE.find((color) => !used.has(color.toLowerCase())) ?? CATEGORY_PALETTE[list.length % CATEGORY_PALETTE.length];
}

export function createCustomCategory(name: string, bucket: BudgetBucket, list: CategoryDef[]): CategoryDef {
  return {
    id: `cat-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    icon: "tag",
    color: nextCategoryColor(list),
    bucket,
    builtIn: false,
    hidden: false,
  };
}

export function isCategoryNameTaken(name: string, list: CategoryDef[], translate: (id: string) => string, exceptId?: string): boolean {
  const clean = name.trim().toLowerCase();
  return list.some((c) => c.id !== exceptId && (c.name ?? translate(c.id)).trim().toLowerCase() === clean);
}

export type CategoryBudgetLevel = "ok" | "warn" | "over";

export type CategoryBudgetStatus = {
  id: string;
  spent: number;
  limit: number;
  ratio: number;
  level: CategoryBudgetLevel;
};

export const BUDGET_WARN_RATIO = 0.8;

export function budgetLevel(ratio: number): CategoryBudgetLevel {
  if (ratio >= 1) return "over";
  if (ratio >= BUDGET_WARN_RATIO) return "warn";
  return "ok";
}

export function spendingByCategory(transactions: Transaction[], month: string): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    if (!tx.date.startsWith(month) || tx.amount >= 0 || tx.category === "Income") continue;
    totals[tx.category] = Math.round(((totals[tx.category] ?? 0) + Math.abs(tx.amount)) * 100) / 100;
  }
  return totals;
}

/** Status for every category that has a monthly limit in `month`. */
export function computeCategoryBudgets(list: CategoryDef[], transactions: Transaction[], month: string): CategoryBudgetStatus[] {
  const spent = spendingByCategory(transactions, month);
  return list
    .filter((c) => c.monthlyLimit && c.monthlyLimit > 0 && !LOCKED_CATEGORY_IDS.has(c.id))
    .map((c) => {
      const limit = c.monthlyLimit as number;
      const used = spent[c.id] ?? 0;
      const ratio = used / limit;
      return { id: c.id, spent: used, limit, ratio, level: budgetLevel(ratio) };
    });
}

/** Category limits rolled up into their 50/30/20 bucket. */
export function limitsByBucket(list: CategoryDef[]): Record<BudgetBucket, number> {
  const totals: Record<BudgetBucket, number> = { Needs: 0, Wants: 0, Savings: 0 };
  for (const c of list) {
    if (c.bucket && c.monthlyLimit && !LOCKED_CATEGORY_IDS.has(c.id)) totals[c.bucket] += c.monthlyLimit;
  }
  return totals;
}

/** Categories whose level got worse between two snapshots (used to raise alerts once per crossing). */
export function newlyCrossedBudgets(previous: CategoryBudgetStatus[], next: CategoryBudgetStatus[]): CategoryBudgetStatus[] {
  const rank: Record<CategoryBudgetLevel, number> = { ok: 0, warn: 1, over: 2 };
  const before = new Map(previous.map((s) => [s.id, s.level]));
  return next.filter((s) => s.level !== "ok" && rank[s.level] > rank[before.get(s.id) ?? "ok"]);
}

export function isCategoryUsed(id: string, transactions: Transaction[], extra: Array<{ category: string }> = []): boolean {
  return transactions.some((tx) => tx.category === id) || extra.some((item) => item.category === id);
}
