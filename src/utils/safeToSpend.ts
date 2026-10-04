import type { Allocation, DailySafeToSpend, Transaction } from "../types";
import type { RecurringBill, SavingsGoal } from "../types";
import { getDaysInMonth } from "./dates";
import { getUnpaidBillOccurrences } from "./recurringBills";

export { getDaysInMonth } from "./dates";

/**
 * Returns the current date formatted as YYYY-MM-DD in local system time
 */
export function getLocalTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns number of days in a given month (1-indexed month)
 */
export type SafeToSpendOptions = {
  recurringBills?: RecurringBill[];
  savingsGoals?: SavingsGoal[];
};

/**
 * Calculate Daily Safe-to-Spend metric and realtime budget feedback.
 *
 * Formula:
 * - Planned Savings = the larger of the savings allocation and dated goal contributions
 * - Spendable Monthly Budget = planned income - Planned Savings
 * - Month Remaining Spendable = Spendable Monthly Budget - logged living expenses - unpaid bills
 * - Days Remaining = Days left in the month including today
 * - Daily allowance = (Month Remaining + Today Spent) / Days Remaining (clamped >= 0)
 * - Today Remaining = Daily Safe-to-Spend - Today's Logged Expenses
 */
export function calculateDailySafeToSpend(
  transactions: Transaction[],
  allocations: Allocation[],
  expectedIncome: number,
  activeMonth: string, // "YYYY-MM"
  currentDateIso?: string, // "YYYY-MM-DD"
  options: SafeToSpendOptions = {}
): DailySafeToSpend {
  const todayStr = currentDateIso || getLocalTodayISO();
  const [yearStr, monthStr] = activeMonth.split("-");
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  const totalDaysInMonth = getDaysInMonth(year, month);

  // Determine current day of month and days remaining
  let daysRemainingInMonth = totalDaysInMonth;
  const currentMonthISO = todayStr.slice(0, 7);

  if (activeMonth === currentMonthISO) {
    const currentDay = parseInt(todayStr.slice(8, 10), 10) || 1;
    daysRemainingInMonth = Math.max(1, totalDaysInMonth - currentDay + 1);
  } else if (activeMonth < currentMonthISO) {
    // Past month
    daysRemainingInMonth = 1;
  } else {
    // Future month
    daysRemainingInMonth = totalDaysInMonth;
  }

  // Keep the savings allocation as a floor so dated goals never reserve the same savings twice.
  const savingsAlloc = allocations.find(
    (a) =>
      a.label.toLowerCase().includes("saving") ||
      a.id.toLowerCase().includes("saving")
  );
  const savingsPercent = savingsAlloc ? Math.min(100, Math.max(0, savingsAlloc.percent)) : 20;
  // This is a forecast from the plan, not available cash. With no plan, use recorded income.
  const monthIncomeLogs = transactions
    .filter((tx) => tx.date.startsWith(activeMonth) && tx.amount > 0 && tx.category === "Income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const baselineIncome = Math.max(0, expectedIncome > 0 ? expectedIncome : monthIncomeLogs);
  const savingsAllocationAmount = Math.round((baselineIncome * savingsPercent) / 100);
  const datedGoalContributions = (options.savingsGoals || [])
    .filter((goal) => goal.status === "active" && goal.targetDate && goal.currentAmount < goal.targetAmount)
    .reduce((sum, goal) => {
      const targetMonth = goal.targetDate!.slice(0, 7);
      const [targetYear, targetMonthNumber] = targetMonth.split("-").map(Number);
      const [activeYear, activeMonthNumber] = activeMonth.split("-").map(Number);
      const monthsRemaining = Math.max(1, (targetYear - activeYear) * 12 + targetMonthNumber - activeMonthNumber + 1);
      return sum + Math.ceil((goal.targetAmount - goal.currentAmount) / monthsRemaining);
    }, 0);
  const plannedSavingsAmount = Math.max(savingsAllocationAmount, datedGoalContributions);
  const monthSpendableBudget = Math.max(0, baselineIncome - plannedSavingsAmount);

  const transactionIds = new Set(transactions.map((transaction) => transaction.id));
  const unpaidBills = getUnpaidBillOccurrences(options.recurringBills || [], activeMonth, todayStr, transactionIds);
  const unpaidBillsTotal = unpaidBills.reduce((sum, occurrence) => sum + occurrence.bill.amount, 0);

  // Month total expenses for spendable living budget (Needs + Wants)
  const monthSpent = Math.abs(
    transactions
      .filter(
        (tx) =>
          tx.date.startsWith(activeMonth) &&
          tx.amount < 0 &&
          tx.category !== "Income" &&
          tx.category !== "Savings"
      )
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  // Today's total expenses for spendable living budget (Needs + Wants)
  const todaySpent = Math.abs(
    transactions
      .filter(
        (tx) =>
          activeMonth === currentMonthISO && tx.date === todayStr &&
          tx.amount < 0 &&
          tx.category !== "Income" &&
          tx.category !== "Savings"
      )
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  const monthRemaining = monthSpendableBudget - monthSpent - unpaidBillsTotal;
  const dailySafeToSpend =
    monthRemaining > 0
      ? Math.round((monthRemaining + todaySpent) / Math.max(1, daysRemainingInMonth))
      : 0;

  const todayRemaining = dailySafeToSpend - todaySpent;

  // Determine financial comfort status
  let status: "comfortable" | "caution" | "critical" = "comfortable";
  const baselineDailyTarget = monthSpendableBudget / totalDaysInMonth;

  if (monthRemaining <= 0 || dailySafeToSpend <= 0) {
    status = "critical";
  } else if (todayRemaining < 0 || dailySafeToSpend < baselineDailyTarget * 0.5) {
    status = "caution";
  } else {
    status = "comfortable";
  }

  return {
    dailySafeToSpend,
    todayRemaining,
    todaySpent,
    plannedSavingsAmount,
    unpaidBillsTotal,
    monthSpendableBudget,
    monthSpent,
    monthRemaining,
    shortfall: Math.max(0, -monthRemaining),
    daysRemainingInMonth,
    totalDaysInMonth,
    status,
  };
}
