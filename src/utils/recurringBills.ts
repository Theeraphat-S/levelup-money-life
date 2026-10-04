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
    const [startYear, startMonth] = bill.startsOn.split("-").map(Number);
    const payments = new Set(bill.payments
      .filter((payment) => (!transactionIds || transactionIds.has(payment.transactionId)) && payment.paidOn <= referenceDate)
      .map((payment) => payment.dueDate));

    if (bill.recurrence === "monthly") {
      for (let year = startYear; year <= selectedYear; year++) {
        const firstMonth = year === startYear ? startMonth : 1;
        const lastMonth = year === selectedYear ? selectedMonth : 12;
        for (let month = firstMonth; month <= lastMonth; month++) {
          const dueDate = dueDateForMonth(year, month, bill.dueDay);
          if (dueDate < bill.startsOn || payments.has(dueDate)) continue;
          occurrences.push({ bill, dueDate, overdue: dueDate < referenceDate });
        }
      }
      return;
    }

    const dueMonth = bill.dueMonth ?? startMonth;
    for (let year = startYear; year <= selectedYear; year++) {
      if (year === selectedYear && dueMonth > selectedMonth) continue;
      const dueDate = dueDateForMonth(year, dueMonth, bill.dueDay);
      if (dueDate < bill.startsOn || payments.has(dueDate)) continue;
      occurrences.push({ bill, dueDate, overdue: dueDate < referenceDate });
    }
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
