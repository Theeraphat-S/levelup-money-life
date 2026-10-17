import { describe, expect, it } from "vitest";
import type { Transaction } from "../types";
import {
  BUILT_IN_CATEGORIES,
  CATEGORY_PALETTE,
  bucketForCategory,
  computeCategoryBudgets,
  createCustomCategory,
  expenseCategoryIds,
  findCategory,
  isCategoryNameTaken,
  limitsByBucket,
  mergeWithBuiltIns,
  newlyCrossedBudgets,
} from "./categories";

const spend = (category: string, amount: number, date = "2026-10-05"): Transaction => ({
  id: `${category}-${amount}-${date}`, name: category, amount: -amount, date, category, cleared: true,
});

describe("categories", () => {
  it("gives every built-in a distinct colour and icon", () => {
    expect(new Set(BUILT_IN_CATEGORIES.map((c) => c.color)).size).toBe(BUILT_IN_CATEGORIES.length);
    expect(new Set(BUILT_IN_CATEGORIES.map((c) => c.icon)).size).toBe(BUILT_IN_CATEGORIES.length);
  });

  it("starts from the built-ins when nothing is stored", () => {
    expect(mergeWithBuiltIns(undefined).map((c) => c.id)).toEqual(BUILT_IN_CATEGORIES.map((c) => c.id));
  });

  it("keeps user tweaks to built-ins and appends custom categories", () => {
    const merged = mergeWithBuiltIns([
      { id: "Fun", color: "#4E9A47", icon: "FilmSlate", bucket: "Needs", hidden: true, monthlyLimit: 2000 },
      { id: "cat-pet", name: "Pets", icon: "PawPrint", color: "#A055A8", bucket: "Needs", hidden: false },
    ]);
    expect(findCategory(merged, "Fun")).toMatchObject({ builtIn: true, color: "#4E9A47", icon: "FilmSlate", bucket: "Needs", hidden: true, monthlyLimit: 2000 });
    expect(merged[merged.length - 1]).toMatchObject({ id: "cat-pet", name: "Pets", builtIn: false });
  });

  it("never lets Income or Savings be hidden, re-bucketed or capped", () => {
    const merged = mergeWithBuiltIns([{ id: "Savings", bucket: "Wants", hidden: true, monthlyLimit: 10, icon: "Tag", color: "#000000" }]);
    expect(findCategory(merged, "Savings")).toMatchObject({ bucket: "Savings", hidden: false });
    expect(findCategory(merged, "Savings").monthlyLimit).toBeUndefined();
  });

  it("drops malformed stored entries and sanitizes fields", () => {
    const merged = mergeWithBuiltIns([null, { id: "" }, { id: "cat-x", name: "X", icon: "Nope", color: "red", bucket: "Other" }]);
    expect(findCategory(merged, "cat-x")).toMatchObject({ icon: "Tag", color: "#62808C", bucket: "Wants" });
  });

  it("falls back to a neutral style and the Wants bucket for unknown ids", () => {
    expect(findCategory(BUILT_IN_CATEGORIES, "Mystery")).toMatchObject({ name: "Mystery", bucket: "Wants" });
    expect(bucketForCategory(BUILT_IN_CATEGORIES, "Transport")).toBe("Needs");
  });

  it("lists visible expense categories, keeping a hidden current value when asked", () => {
    const list = mergeWithBuiltIns([{ id: "Fun", hidden: true, icon: "GameController", color: "#C96A2E", bucket: "Wants" }]);
    expect(expenseCategoryIds(list)).not.toContain("Fun");
    expect(expenseCategoryIds(list, { keep: "Fun" })).toContain("Fun");
    expect(expenseCategoryIds(list)).not.toContain("Income");
    expect(expenseCategoryIds(list, { excludeSavings: true })).not.toContain("Savings");
  });

  it("creates custom categories with an unused palette colour", () => {
    const created = createCustomCategory("  Pets ", "Needs", BUILT_IN_CATEGORIES);
    expect(created).toMatchObject({ name: "Pets", bucket: "Needs", builtIn: false });
    expect(BUILT_IN_CATEGORIES.map((c) => c.color)).not.toContain(created.color);
    expect(CATEGORY_PALETTE).toContain(created.color);
  });

  it("detects duplicate names against translated built-ins", () => {
    const translate = (id: string) => ({ Food: "อาหาร" }[id] ?? id);
    expect(isCategoryNameTaken("อาหาร ", BUILT_IN_CATEGORIES, translate)).toBe(true);
    expect(isCategoryNameTaken("Pets", BUILT_IN_CATEGORIES, translate)).toBe(false);
  });
});

describe("category budgets", () => {
  const list = mergeWithBuiltIns([
    { id: "Food", monthlyLimit: 1000, icon: "ForkKnife", color: "#B5822F", bucket: "Needs" },
    { id: "Fun", monthlyLimit: 500, icon: "GameController", color: "#C96A2E", bucket: "Wants" },
    { id: "Home", monthlyLimit: 300, icon: "House", color: "#6F8A45", bucket: "Needs" },
  ]);

  it("measures this month's spending against each limit", () => {
    const statuses = computeCategoryBudgets(list, [
      spend("Food", 850), spend("Fun", 600), spend("Fun", 999, "2026-09-30"), spend("Home", 10),
    ], "2026-10");
    expect(Object.fromEntries(statuses.map((s) => [s.id, [s.spent, s.level]]))).toEqual({
      Food: [850, "warn"], Fun: [600, "over"], Home: [10, "ok"],
    });
  });

  it("rolls limits up into their buckets", () => {
    expect(limitsByBucket(list)).toEqual({ Needs: 1300, Wants: 500, Savings: 0 });
  });

  it("reports a category only when its level gets worse", () => {
    const warn = [{ id: "Food", spent: 800, limit: 1000, ratio: 0.8, level: "warn" as const }];
    const over = [{ id: "Food", spent: 1000, limit: 1000, ratio: 1, level: "over" as const }];
    expect(newlyCrossedBudgets([], warn)).toHaveLength(1);
    expect(newlyCrossedBudgets(warn, warn)).toHaveLength(0);
    expect(newlyCrossedBudgets(warn, over)).toHaveLength(1);
    expect(newlyCrossedBudgets(over, warn)).toHaveLength(0);
  });
});
