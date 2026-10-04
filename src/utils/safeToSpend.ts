import type { Allocation, DailySafeToSpend, Transaction } from "../types";

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
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate Daily Safe-to-Spend metric and realtime budget feedback.
 *
 * Formula:
 * - Spendable Monthly Budget = Income * (Needs% + Wants%) / 100 [or Income - Savings allocation]
 * - Month Outflow = Sum of all expenses logged in the active month
 * - Month Remaining Spendable = Spendable Monthly Budget - Month Outflow
 * - Days Remaining = Days left in the month including today
 * - Daily allowance = (Month Remaining + Today Spent) / Days Remaining (clamped >= 0)
 * - Today Remaining = Daily Safe-to-Spend - Today's Logged Expenses
 */
export function calculateDailySafeToSpend(
  transactions: Transaction[],
  allocations: Allocation[],
  expectedIncome: number,
  activeMonth: string, // "YYYY-MM"
  currentDateIso?: string // "YYYY-MM-DD"
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

  // Calculate Savings percentage from allocations (default 20% if not defined)
  const savingsAlloc = allocations.find(
    (a) =>
      a.label.toLowerCase().includes("saving") ||
      a.id.toLowerCase().includes("saving")
  );
  const savingsPercent = savingsAlloc ? Math.min(100, Math.max(0, savingsAlloc.percent)) : 20;
  const spendablePercent = Math.max(0, 100 - savingsPercent);

  // This is a forecast from the plan, not available cash. With no plan, use recorded income.
  const monthIncomeLogs = transactions
    .filter((tx) => tx.date.startsWith(activeMonth) && tx.amount > 0 && tx.category === "Income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const baselineIncome = Math.max(0, expectedIncome > 0 ? expectedIncome : monthIncomeLogs);
  const monthSpendableBudget = Math.round((baselineIncome * spendablePercent) / 100);

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

  const monthRemaining = monthSpendableBudget - monthSpent;
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
    monthSpendableBudget,
    monthSpent,
    monthRemaining,
    daysRemainingInMonth,
    totalDaysInMonth,
    status,
  };
}
