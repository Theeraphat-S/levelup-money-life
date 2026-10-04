import type { BillOccurrence, RecurringBill, RecurringBillPayment } from "../types";
import { getDaysInMonth } from "./dates";

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dueDateForMonth(year: number, month: number, dueDay: number): string {
  return formatDate(year, month, Math.min(dueDay, getDaysInMonth(year, month)));
}

function getSelectedMonthReferenceDate(activeMonth: string, today: string): string {
  const currentMonth = today.slice(0, 7);
  if (activeMonth === currentMonth) return today;
  if (activeMonth < currentMonth) {
    const [year, month] = activeMonth.split("-").map(Number);
    return formatDate(year, month, getDaysInMonth(year, month));
  }
  return `${activeMonth}-01`;
}

export function getUnpaidBillOccurrences(
  bills: RecurringBill[],
  activeMonth: string,
  today: string,
  transactionIds?: ReadonlySet<string>
): BillOccurrence[] {
  const [selectedYear, selectedMonth] = activeMonth.split("-").map(Number);
  const referenceDate = getSelectedMonthReferenceDate(activeMonth, today);
  const occurrences: BillOccurrence[] = [];

  bills.filter((bill) => bill.active).forEach((bill) => {
    if (`${activeMonth}-${String(getDaysInMonth(selectedYear, selectedMonth)).padStart(2, "0")}` < bill.startsOn) return;
    const payments = new Set(bill.payments
      .filter((payment) => (!transactionIds || transactionIds.has(payment.transactionId)) && payment.paidOn <= referenceDate)
      .map((payment) => payment.dueDate));
    if (bill.recurrence === "yearly" && (bill.dueMonth ?? Number(bill.startsOn.slice(5, 7))) !== selectedMonth) return;
    const dueDate = dueDateForMonth(selectedYear, selectedMonth, bill.dueDay);
    if (dueDate < bill.startsOn || payments.has(dueDate)) return;
    occurrences.push({ bill, dueDate, overdue: dueDate < referenceDate });
  });

  return occurrences.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.bill.name.localeCompare(b.bill.name));
}

export function recordBillPayment(
  bill: RecurringBill,
  payment: RecurringBillPayment
): RecurringBill {
  return {
    ...bill,
    payments: [
      ...bill.payments.filter((existing) => existing.dueDate !== payment.dueDate),
      payment,
    ],
  };
}
