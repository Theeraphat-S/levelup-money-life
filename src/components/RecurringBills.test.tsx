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

    const [year, month, day] = today.split("-").map(Number);
    const expectedStart = day === 1
      ? today
      : `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`;
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
    })));
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
