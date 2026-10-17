import { describe, expect, it } from "vitest";
import type { Account, Transaction, Transfer } from "../types";
import { getCardBillForMonth, getCardBills } from "./cardBills";

const card: Account = {
  id: "ktc", name: "KTC", type: "credit", openingBalance: 0, archived: false,
  createdAt: "2026-08-01", statementDay: 25, dueDay: 10,
};

const swipe = (date: string, amount: number): Transaction => ({
  id: `${date}-${amount}`, name: "swipe", amount: -amount, date, category: "Food", cleared: true, accountId: "ktc",
});

const pay = (date: string, amount: number): Transfer => ({ id: `p-${date}`, fromAccountId: "kb", toAccountId: "ktc", amount, date });

describe("card bills", () => {
  it("bills what was owed at the previous month's statement when the due day comes first", () => {
    const bill = getCardBillForMonth(card, "2026-10", "2026-10-05", [swipe("2026-09-20", 1200), swipe("2026-09-28", 300)], []);
    expect(bill).toMatchObject({ statementDate: "2026-09-25", dueDate: "2026-10-10", statementAmount: 1200, remaining: 1200, overdue: false });
  });

  it("uses the same month's statement when it is cut before the due day", () => {
    const early = { ...card, statementDay: 5, dueDay: 20 };
    const bill = getCardBillForMonth(early, "2026-10", "2026-10-01", [swipe("2026-10-03", 500), swipe("2026-10-06", 99)], []);
    expect(bill).toMatchObject({ statementDate: "2026-10-05", dueDate: "2026-10-20", statementAmount: 500 });
  });

  it("subtracts payments made after the statement and marks overdue only while money is left", () => {
    const txs = [swipe("2026-09-20", 1200)];
    expect(getCardBillForMonth(card, "2026-10", "2026-10-12", txs, [pay("2026-10-01", 200)])).toMatchObject({ paidAmount: 200, remaining: 1000, overdue: true });
    expect(getCardBillForMonth(card, "2026-10", "2026-10-12", txs, [pay("2026-10-01", 1200)])).toMatchObject({ remaining: 0, overdue: false });
  });

  it("counts the previous payment against the statement balance, not this cycle", () => {
    // Paying September's bill on 2026-09-01 happens before the 2026-09-25 statement and lowers it
    const txs = [swipe("2026-08-20", 1000), swipe("2026-09-10", 400)];
    const bill = getCardBillForMonth(card, "2026-10", "2026-10-01", txs, [pay("2026-09-01", 1000)]);
    expect(bill).toMatchObject({ statementAmount: 400, paidAmount: 0 });
  });

  it("clamps days to short months and crosses the year boundary", () => {
    const endOfMonth = { ...card, statementDay: 31, dueDay: 15 };
    const bill = getCardBillForMonth(endOfMonth, "2027-01", "2027-01-02", [swipe("2026-12-20", 50)], []);
    expect(bill).toMatchObject({ statementDate: "2026-12-31", dueDate: "2027-01-15" });
    const feb = getCardBillForMonth({ ...card, statementDay: 31, dueDay: 31 }, "2027-03", "2027-03-01", [swipe("2027-02-10", 10)], []);
    expect(feb).toMatchObject({ statementDate: "2027-02-28", dueDate: "2027-03-31" });
  });

  it("skips cards without a cycle, with nothing owed, or added after the statement", () => {
    expect(getCardBillForMonth({ ...card, statementDay: undefined }, "2026-10", "2026-10-01", [swipe("2026-09-20", 10)], [])).toBeNull();
    expect(getCardBillForMonth(card, "2026-10", "2026-10-01", [], [])).toBeNull();
    expect(getCardBillForMonth({ ...card, createdAt: "2026-10-01" }, "2026-10", "2026-10-01", [swipe("2026-09-20", 10)], [])).toBeNull();
  });

  it("includes debt carried in through the opening balance", () => {
    expect(getCardBills([{ ...card, openingBalance: -3000 }], "2026-10", "2026-10-01", [], [])[0]?.statementAmount).toBe(3000);
  });
});
