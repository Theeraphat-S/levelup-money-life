import { describe, it, expect } from "vitest";
import { calculateDailySafeToSpend, getDaysInMonth } from "./safeToSpend";
import type { Allocation, Transaction } from "../types";

describe("safeToSpend", () => {
  const defaultAllocations: Allocation[] = [
    { id: "needs", label: "Needs", percent: 50, color: "#1C5954" },
    { id: "wants", label: "Wants", percent: 30, color: "#879B62" },
    { id: "savings", label: "Savings", percent: 20, color: "#4D8E75" },
  ];

  it("calculates correct days in month for regular and leap years", () => {
    expect(getDaysInMonth(2026, 8)).toBe(31); // August 2026
    expect(getDaysInMonth(2026, 2)).toBe(28); // Feb 2026 (non-leap)
    expect(getDaysInMonth(2024, 2)).toBe(29); // Feb 2024 (leap)
    expect(getDaysInMonth(2026, 4)).toBe(30); // April 2026
  });

  it("calculates daily safe-to-spend on day 1 with no expenses", () => {
    const transactions: Transaction[] = [];
    const income = 48000;
    // 50% Needs + 30% Wants = 80% of 48,000 = 38,400 THB spendable
    // August has 31 days. Day 1 -> 31 days remaining -> 38,400 / 31 = 1,238.7 -> 1,239 THB/day
    const result = calculateDailySafeToSpend(
      transactions,
      defaultAllocations,
      income,
      "2026-08",
      "2026-08-01"
    );

    expect(result.monthSpendableBudget).toBe(38400);
    expect(result.monthSpent).toBe(0);
    expect(result.monthRemaining).toBe(38400);
    expect(result.daysRemainingInMonth).toBe(31);
    expect(result.dailySafeToSpend).toBe(1239);
    expect(result.todayRemaining).toBe(1239);
    expect(result.status).toBe("comfortable");
  });

  it("recalculates safe-to-spend dynamically as expenses are logged today", () => {
    const transactions: Transaction[] = [
      {
        id: "t1",
        name: "Morning Coffee",
        amount: -60,
        date: "2026-08-24",
        category: "Food",
        cleared: true,
      },
      {
        id: "t2",
        name: "Lunch",
        amount: -120,
        date: "2026-08-24",
        category: "Food",
        cleared: true,
      },
      {
        id: "t3",
        name: "Groceries past week",
        amount: -15000,
        date: "2026-08-10",
        category: "Food",
        cleared: true,
      },
    ];

    const income = 48000;
    // 38,400 budget - 15,180 spent = 23,220 remaining
    // August 24 -> 31 - 24 + 1 = 8 days left
    // 23,220 / 8 = 2,902.5 -> 2,903 THB/day
    // Today spent = 60 + 120 = 180 THB
    // Today remaining = 2,903 - 180 = 2,723 THB
    const result = calculateDailySafeToSpend(
      transactions,
      defaultAllocations,
      income,
      "2026-08",
      "2026-08-24"
    );

    expect(result.monthSpent).toBe(15180);
    expect(result.todaySpent).toBe(180);
    expect(result.monthRemaining).toBe(23220);
    expect(result.daysRemainingInMonth).toBe(8);
    // Set today's allowance from the balance before today's expenses.
    expect(result.dailySafeToSpend).toBe(2925);
    expect(result.todayRemaining).toBe(2745);
    expect(result.status).toBe("comfortable");
  });

  it("handles critical status when budget is exhausted or negative", () => {
    const transactions: Transaction[] = [
      {
        id: "t1",
        name: "Big Expense",
        amount: -45000,
        date: "2026-08-20",
        category: "Fun",
        cleared: true,
      },
    ];

    const income = 48000; // Spendable budget = 38,400 THB
    const result = calculateDailySafeToSpend(
      transactions,
      defaultAllocations,
      income,
      "2026-08",
      "2026-08-24"
    );

    expect(result.monthRemaining).toBeLessThan(0);
    expect(result.dailySafeToSpend).toBe(0);
    expect(result.status).toBe("critical");
  });

  it("handles caution status when today expenses exceed daily safe-to-spend", () => {
    const transactions: Transaction[] = [
      {
        id: "t1",
        name: "Fancy Dinner",
        amount: -2500,
        date: "2026-08-24",
        category: "Food",
        cleared: true,
      },
    ];

    const income = 48000;
    // Spendable budget 38,400 - 2,500 = 35,900
    // 8 days left -> 35,900 / 8 = 4,488 THB/day
    // But if today's logged expense is 5,000 THB:
    const heavyTx: Transaction[] = [
      {
        id: "t1",
        name: "Fancy Dinner",
        amount: -5000,
        date: "2026-08-24",
        category: "Food",
        cleared: true,
      },
    ];
    // Remaining = 33,400 / 8 = 4,175 THB/day
    // Today remaining = 4,175 - 5,000 = -825 (negative for today)
    const result = calculateDailySafeToSpend(
      heavyTx,
      defaultAllocations,
      income,
      "2026-08",
      "2026-08-24"
    );

    expect(result.todayRemaining).toBeLessThan(0);
    expect(result.status).toBe("caution");
  });

  it("does not double-deduct savings goal transfers from spendable living budget", () => {
    const transactions: Transaction[] = [
      {
        id: "s1",
        name: "Emergency Fund Transfer",
        amount: -5000,
        date: "2026-08-24",
        category: "Savings",
        cleared: true,
      },
      {
        id: "t1",
        name: "Lunch",
        amount: -100,
        date: "2026-08-24",
        category: "Food",
        cleared: true,
      },
    ];

    const income = 50000;
    // 50k * 80% = 40,000 spendable living allowance
    // Outflow from living expenses is only 100 THB (Food), not 5,100 THB!
    // 8 days remaining -> (40,000 - 100) / 8 = 39,900 / 8 = 4,988 THB/day
    // Today remaining = 4,988 - 100 = 4,888 THB
    const result = calculateDailySafeToSpend(
      transactions,
      defaultAllocations,
      income,
      "2026-08",
      "2026-08-24"
    );

    expect(result.monthSpent).toBe(100);
    expect(result.todaySpent).toBe(100);
    expect(result.monthRemaining).toBe(39900);
    expect(result.dailySafeToSpend).toBe(5000);
    expect(result.todayRemaining).toBe(4900);
    expect(result.status).toBe("comfortable");
  });

  it("handles zero income and negative budget scenarios safely", () => {
    const transactions: Transaction[] = [];
    const result = calculateDailySafeToSpend(
      transactions,
      defaultAllocations,
      0,
      "2026-08",
      "2026-08-15"
    );

    expect(result.monthSpendableBudget).toBe(0);
    expect(result.monthRemaining).toBe(0);
    expect(result.dailySafeToSpend).toBe(0);
    expect(result.status).toBe("critical");
  });

  it("handles 100% savings target where spendable percent is 0", () => {
    const highSavingsAllocs: Allocation[] = [
      { id: "savings", label: "Savings", percent: 100, color: "#4D8E75" },
    ];
    const transactions: Transaction[] = [];
    const result = calculateDailySafeToSpend(
      transactions,
      highSavingsAllocs,
      50000,
      "2026-08",
      "2026-08-10"
    );

    expect(result.monthSpendableBudget).toBe(0);
    expect(result.dailySafeToSpend).toBe(0);
    expect(result.status).toBe("critical");
  });

  it("handles leap year Feb 29 month-end boundary condition", () => {
    const transactions: Transaction[] = [];
    const result = calculateDailySafeToSpend(
      transactions,
      defaultAllocations,
      50000,
      "2024-02",
      "2024-02-29"
    );

    expect(result.totalDaysInMonth).toBe(29);
    expect(result.daysRemainingInMonth).toBe(1);
    expect(result.dailySafeToSpend).toBe(40000); // 40,000 / 1 day
  });

  it("handles future and past months correctly", () => {
    // Future month
    const future = calculateDailySafeToSpend(
      [],
      defaultAllocations,
      48000,
      "2026-12",
      "2026-08-24"
    );
    expect(future.daysRemainingInMonth).toBe(31);
    expect(future.dailySafeToSpend).toBe(1239);

    // Past month
    const past = calculateDailySafeToSpend(
      [],
      defaultAllocations,
      48000,
      "2026-01",
      "2026-08-24"
    );
    expect(past.daysRemainingInMonth).toBe(1);
  });

  it("does not mix today's spending into historical or future budgets", () => {
    const tx: Transaction = { id: "today", name: "Coffee", amount: -100, date: "2026-08-24", category: "Food", cleared: true };
    for (const month of ["2026-07", "2026-09"]) {
      const result = calculateDailySafeToSpend([tx], defaultAllocations, 30000, month, "2026-08-24");
      expect(result.todaySpent).toBe(0);
      expect(result.monthSpent).toBe(0);
    }
  });

  it("does not treat savings withdrawals as income or inflate a planned budget", () => {
    const txs: Transaction[] = [
      { id: "saving", name: "Withdraw savings", amount: 100000, date: "2026-08-24", category: "Savings", cleared: true },
      { id: "salary", name: "Salary", amount: 40000, date: "2026-08-01", category: "Income", cleared: true },
    ];
    expect(calculateDailySafeToSpend(txs, defaultAllocations, 20000, "2026-08", "2026-08-24").monthSpendableBudget).toBe(16000);
    expect(calculateDailySafeToSpend(txs.slice(0, 1), defaultAllocations, 0, "2026-08", "2026-08-24").monthSpendableBudget).toBe(0);
  });

  it("subtracts today's expense only once from today's allowance", () => {
    const tx: Transaction = { id: "lunch", name: "Lunch", amount: -300, date: "2026-05-29", category: "Food", cleared: true };
    const result = calculateDailySafeToSpend([tx], [{ id: "savings", label: "Savings", percent: 0, color: "green" }], 3000, "2026-05", "2026-05-29");
    expect(result.monthRemaining).toBe(2700);
    expect(result.daysRemainingInMonth).toBe(3);
    expect(result.dailySafeToSpend).toBe(1000);
    expect(result.todayRemaining).toBe(700);
  });
});

