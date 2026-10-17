import { describe, expect, it } from "vitest";
import type { Account } from "../types";
import { buildBalanceAdjustment, unaccountedTotal, UNACCOUNTED_CATEGORY } from "./balanceCheck";

const account: Account = { id: "kb", name: "KBank", type: "bank", openingBalance: 0, archived: false, createdAt: "2026-10-01" };
const labels = { unaccounted: "Unaccounted spending", adjustment: "Balance adjustment" };
const base = { account, date: "2026-10-17", labels };

describe("balance check", () => {
  it("does nothing when the balance matches", () => {
    expect(buildBalanceAdjustment({ ...base, recordedBalance: 1000, actualBalance: 1000 })).toEqual({ ok: true, difference: 0, transactions: [] });
  });

  it("records a shortfall as unaccounted spending on that account", () => {
    const result = buildBalanceAdjustment({ ...base, recordedBalance: 5000, actualBalance: 3760 });
    expect(result).toMatchObject({ ok: true, difference: -1240 });
    if (!result.ok) return;
    expect(result.transactions).toEqual([
      expect.objectContaining({ amount: -1240, category: UNACCOUNTED_CATEGORY, accountId: "kb", date: "2026-10-17", name: "Unaccounted spending" }),
    ]);
  });

  it("splits part of a shortfall into known spending and leaves the rest unaccounted", () => {
    const result = buildBalanceAdjustment({
      ...base,
      recordedBalance: 5000,
      actualBalance: 3760,
      splits: [{ name: "Taxi", amount: 240, category: "Transport" }, { name: "Lunch", amount: 1000, category: "Food" }],
    });
    if (!result.ok) throw new Error("expected ok");
    expect(result.transactions.map((t) => [t.name, t.amount, t.category])).toEqual([
      ["Taxi", -240, "Transport"],
      ["Lunch", -1000, "Food"],
    ]);
  });

  it("rejects splits larger than the shortfall or incomplete split lines", () => {
    expect(buildBalanceAdjustment({ ...base, recordedBalance: 100, actualBalance: 50, splits: [{ name: "x", amount: 60, category: "Food" }] }))
      .toEqual({ ok: false, error: "splitsExceedDifference" });
    expect(buildBalanceAdjustment({ ...base, recordedBalance: 100, actualBalance: 50, splits: [{ name: "", amount: 10, category: "Food" }] }))
      .toEqual({ ok: false, error: "invalidSplit" });
  });

  it("records a surplus as one adjustment income", () => {
    const result = buildBalanceAdjustment({ ...base, recordedBalance: 100, actualBalance: 350.5 });
    if (!result.ok) throw new Error("expected ok");
    expect(result.transactions).toEqual([expect.objectContaining({ amount: 250.5, category: "Income", name: "Balance adjustment" })]);
  });

  it("works for credit cards where the balance is negative", () => {
    // App thinks 2,000 is owed, the statement says 2,300
    const result = buildBalanceAdjustment({ ...base, account: { ...account, type: "credit" }, recordedBalance: -2000, actualBalance: -2300 });
    expect(result).toMatchObject({ ok: true, difference: -300 });
  });

  it("totals unaccounted spending per month", () => {
    const tx = (amount: number, date: string, category = UNACCOUNTED_CATEGORY) => ({ id: date + amount, name: "u", amount, date, category, cleared: true });
    expect(unaccountedTotal([tx(-100, "2026-10-01"), tx(-50, "2026-10-20"), tx(-70, "2026-09-30"), tx(-5, "2026-10-02", "Food")], "2026-10")).toBe(150);
  });
});
