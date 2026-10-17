import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "../i18n";
import type { RecurringBill } from "../types";
import { getLocalTodayISO } from "../utils/safeToSpend";
import { RecurringBillsManager, UpcomingBillsSummary } from "./RecurringBills";

afterEach(cleanup);

const emptyBills: RecurringBill[] = [];

describe("RecurringBillsManager", () => {
  it("lets the user add a monthly bill from Budget", async () => {
    await i18n.changeLanguage("en");
    const onSaveBills = vi.fn();
    const today = getLocalTodayISO();
    render(<RecurringBillsManager bills={emptyBills} transactions={[]} activeMonth={today.slice(0, 7)} onSaveBills={onSaveBills} onPayBill={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /add bill/i }));
    fireEvent.change(screen.getByLabelText("Bill name"), { target: { value: "Internet" } });
    fireEvent.change(screen.getByLabelText("Planned amount (THB)"), { target: { value: "799" } });
    fireEvent.click(screen.getByRole("button", { name: "Save bill" }));

    const expectedStart = `${today.slice(0, 7)}-01`;
    await waitFor(() => expect(onSaveBills).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Internet", amount: 799, category: "Home", recurrence: "monthly", active: true, startsOn: expectedStart }),
    ]));
  });

  it("requires the actual amount and records a bill payment only after confirmation", async () => {
    await i18n.changeLanguage("en");
    const today = getLocalTodayISO();
    const bill: RecurringBill = {
      id: "rent",
      name: "Rent",
      amount: 12000,
      category: "Home",
      recurrence: "monthly",
      dueDay: Number(today.slice(8)),
      startsOn: today,
      estimated: true,
      active: true,
      payments: [],
    };
    const onPayBill = vi.fn().mockResolvedValue(undefined);
    render(<RecurringBillsManager bills={[bill]} transactions={[]} activeMonth={today.slice(0, 7)} onSaveBills={vi.fn()} onPayBill={onPayBill} />);

    fireEvent.click(screen.getByRole("button", { name: /pay/i }));
    fireEvent.change(screen.getByLabelText("Amount paid (THB)"), { target: { value: "12100" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    await waitFor(() => expect(onPayBill).toHaveBeenCalledWith(bill, expect.objectContaining({
      dueDate: today,
      paidOn: today,
      amount: 12100,
      transactionId: expect.any(String),
    }), undefined));
  });

  it("records a card bill payment as a transfer from a non-card account", async () => {
    await i18n.changeLanguage("en");
    const today = getLocalTodayISO();
    const bank = { id: "kb", name: "KBank", type: "bank" as const, openingBalance: 0, archived: false, createdAt: "2026-01-01" };
    const card = { id: "ktc", name: "KTC", type: "credit" as const, openingBalance: 0, archived: false, createdAt: "2026-01-01", statementDay: 1, dueDay: 28 };
    const cardBill = { account: card, statementDate: `${today.slice(0, 7)}-01`, dueDate: `${today.slice(0, 7)}-28`, statementAmount: 1500, paidAmount: 0, remaining: 1500, overdue: false };
    const onPayCard = vi.fn();
    render(<RecurringBillsManager bills={[]} transactions={[]} activeMonth={today.slice(0, 7)} onSaveBills={vi.fn()} onPayBill={vi.fn()} cardBills={[cardBill]} accounts={[card, bank]} defaultAccountId="ktc" onPayCard={onPayCard} />);

    expect(screen.getByText("Pay KTC")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Pay card" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm payment" }));

    expect(onPayCard).toHaveBeenCalledWith(expect.objectContaining({ fromAccountId: "kb", toAccountId: "ktc", amount: 1500, date: today }));
  });

  it("shows due bills on the Dashboard and opens Budget management", async () => {
    await i18n.changeLanguage("en");
    const today = getLocalTodayISO();
    const bill: RecurringBill = {
      id: "internet",
      name: "Internet",
      amount: 799,
      category: "Home",
      recurrence: "monthly",
      dueDay: Number(today.slice(8)),
      startsOn: today,
      estimated: false,
      active: true,
      payments: [],
    };
    const setActiveTab = vi.fn();
    render(<UpcomingBillsSummary bills={[bill]} transactions={[]} activeMonth={today.slice(0, 7)} setActiveTab={setActiveTab} />);

    expect(screen.getByText("Internet")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Manage bills" }));
    expect(setActiveTab).toHaveBeenCalledWith("budget");
  });
});
