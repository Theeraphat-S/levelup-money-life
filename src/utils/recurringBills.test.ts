import { describe, expect, it } from "vitest";
import type { RecurringBill } from "../types";
import { getUnpaidBillOccurrences, recordBillPayment } from "./recurringBills";

const monthlyBill: RecurringBill = {
  id: "rent",
  name: "Rent",
  amount: 12000,
  category: "Home",
  recurrence: "monthly",
  dueDay: 31,
  startsOn: "2026-08-31",
  estimated: false,
  active: true,
  payments: [],
};

describe("recurring bills", () => {
  it("creates only the monthly occurrence in the selected month and clamps short months", () => {
    const occurrences = getUnpaidBillOccurrences([monthlyBill], "2026-10", "2026-10-04");

    expect(occurrences.map(({ dueDate, overdue }) => [dueDate, overdue])).toEqual([
      ["2026-10-31", false],
    ]);
  });

  it("marks a selected-month bill overdue after its due day", () => {
    const bill = { ...monthlyBill, dueDay: 2, startsOn: "2026-08-02" };
    expect(getUnpaidBillOccurrences([bill], "2026-10", "2026-10-04").map(({ dueDate, overdue }) => [dueDate, overdue])).toEqual([
      ["2026-10-02", true],
    ]);
  });

  it("does not reserve occurrences that have been paid", () => {
    const bill = recordBillPayment(monthlyBill, {
      dueDate: "2026-08-31",
      paidOn: "2026-09-02",
      amount: 12000,
      transactionId: "payment-1",
    });

    expect(getUnpaidBillOccurrences([bill], "2026-09", "2026-09-04").map(({ dueDate }) => dueDate)).toEqual(["2026-09-30"]);
  });

  it("makes a paid occurrence unpaid again when its ledger transaction has been removed", () => {
    const bill = recordBillPayment(monthlyBill, {
      dueDate: "2026-08-31",
      paidOn: "2026-09-02",
      amount: 12000,
      transactionId: "payment-1",
    });

    expect(getUnpaidBillOccurrences([bill], "2026-08", "2026-08-04", new Set()).map(({ dueDate }) => dueDate)).toEqual([
      "2026-08-31",
    ]);
  });

  it("keeps a historical occurrence unpaid until its recorded payment date", () => {
    const bill = recordBillPayment(monthlyBill, {
      dueDate: "2026-08-31",
      paidOn: "2026-09-02",
      amount: 12000,
      transactionId: "payment-1",
    });

    expect(getUnpaidBillOccurrences([bill], "2026-08", "2026-10-04").map(({ dueDate }) => dueDate)).toEqual([
      "2026-08-31",
    ]);
  });

  it("creates yearly occurrences only in the matching due month", () => {
    const bill: RecurringBill = {
      ...monthlyBill,
      id: "insurance",
      name: "Insurance",
      recurrence: "yearly",
      dueMonth: 11,
      dueDay: 15,
      startsOn: "2025-11-15",
    };

    expect(getUnpaidBillOccurrences([bill], "2026-10", "2026-10-04")).toHaveLength(0);
    expect(getUnpaidBillOccurrences([bill], "2026-11", "2026-10-04").map(({ dueDate }) => dueDate)).toEqual([
      "2026-11-15",
    ]);
  });
});
