import { describe, expect, it } from "vitest";
import type { Account, Transaction } from "../types";
import { mergeWithBuiltIns } from "./categories";
import {
  dueSystemAwards,
  isoWeekKey,
  monthWithinLimitsStatus,
  previousMonth,
  weekStart,
  weeklyBalanceCheckStatus,
} from "./systemQuests";

const account = (lastBalanceCheck?: string, archived = false): Account => ({
  id: `a-${lastBalanceCheck ?? "none"}-${archived}`, name: "A", type: "bank", openingBalance: 0, archived, createdAt: "2026-01-01", lastBalanceCheck,
});
const spend = (category: string, amount: number, date: string): Transaction => ({
  id: `${category}${amount}${date}`, name: category, amount: -amount, date, category, cleared: true,
});
const withFoodLimit = mergeWithBuiltIns([{ id: "Food", monthlyLimit: 1000, icon: "ForkKnife", color: "#B5822F", bucket: "Needs" }]);

describe("weeks and months", () => {
  it("uses ISO weeks that start on Monday", () => {
    expect(weekStart("2026-10-17")).toBe("2026-10-12"); // Saturday -> Monday
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
    expect(isoWeekKey("2026-10-17")).toBe("2026-W42");
    expect(isoWeekKey("2027-01-01")).toBe("2026-W53"); // Friday belongs to the last week of 2026
  });

  it("steps back across the year boundary", () => {
    expect(previousMonth("2026-01")).toBe("2025-12");
    expect(previousMonth("2026-10")).toBe("2026-09");
  });
});

describe("weekly balance check quest", () => {
  it("is done once any active account was checked this week", () => {
    expect(weeklyBalanceCheckStatus([account("2026-10-12"), account()], "2026-10-17")).toMatchObject({ done: true, checked: 1, total: 2 });
    expect(weeklyBalanceCheckStatus([account("2026-10-11")], "2026-10-17").done).toBe(false);
    expect(weeklyBalanceCheckStatus([account("2026-10-13", true)], "2026-10-17").done).toBe(false);
  });
});

describe("month within limits quest", () => {
  it("needs limits and spending, and no category over its limit", () => {
    expect(monthWithinLimitsStatus(withFoodLimit, [spend("Food", 900, "2026-09-10")], "2026-09").ok).toBe(true);
    expect(monthWithinLimitsStatus(withFoodLimit, [spend("Food", 1200, "2026-09-10")], "2026-09")).toMatchObject({ ok: false, overCount: 1 });
    expect(monthWithinLimitsStatus(withFoodLimit, [], "2026-09").ok).toBe(false);
    expect(monthWithinLimitsStatus(mergeWithBuiltIns([]), [spend("Food", 10, "2026-09-10")], "2026-09").ok).toBe(false);
    // Spending only outside limited categories says nothing about the limits
    expect(monthWithinLimitsStatus(withFoodLimit, [spend("Fun", 300, "2026-09-10")], "2026-09").ok).toBe(false);
  });
});

describe("awarding", () => {
  it("rewards this week's check and last month's clean finish once each", () => {
    const first = dueSystemAwards({}, [account("2026-10-14")], withFoodLimit, [spend("Food", 500, "2026-09-03")], "2026-10-17");
    expect(first.awards).toEqual([
      { id: "weeklyCheck", xp: 30, period: "2026-W42" },
      { id: "monthLimits", xp: 100, period: "2026-09" },
    ]);
    const again = dueSystemAwards(first.next, [account("2026-10-15")], withFoodLimit, [spend("Food", 500, "2026-09-03")], "2026-10-18");
    expect(again.awards).toEqual([]);
  });

  it("does not reward an older month after a newer one was already rewarded", () => {
    const result = dueSystemAwards({ monthLimits: "2026-10" }, [], withFoodLimit, [spend("Food", 1, "2026-09-03")], "2026-10-17");
    expect(result.awards).toEqual([]);
  });
});
