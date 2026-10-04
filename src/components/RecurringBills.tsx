import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDots, CheckCircle, PencilSimple, Plus, Receipt, Trash, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { getUnpaidBillOccurrences } from "../utils/recurringBills";
import { getDaysInMonth, getLocalTodayISO } from "../utils/safeToSpend";
import type { BillOccurrence, RecurringBill, RecurringBillPayment, Transaction, TransactionCategory, ViewTab } from "../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const billCategories: Exclude<TransactionCategory, "Income" | "Savings">[] = [
  "Food", "Transport", "Home", "Health", "Learning", "Fun", "Debt",
];

type BillForm = {
  name: string;
  amount: string;
  category: Exclude<TransactionCategory, "Income" | "Savings">;
  recurrence: "monthly" | "yearly";
  dueDay: string;
  dueMonth: string;
  estimated: boolean;
};

const emptyForm: BillForm = {
  name: "",
  amount: "",
  category: "Home",
  recurrence: "monthly",
  dueDay: "1",
  dueMonth: "1",
  estimated: false,
};

type DialogState =
  | { type: "edit"; bill?: RecurringBill }
  | { type: "pay"; occurrence: BillOccurrence }
  | null;

function occurrenceDate(year: number, month: number, day: number): string {
  const maxDay = getDaysInMonth(year, month);
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, maxDay)).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${year}-${month}-${day}`;
}

export interface RecurringBillsProps {
  bills: RecurringBill[];
  transactions: Transaction[];
  activeMonth: string;
  onSaveBills: (bills: RecurringBill[]) => void;
  onPayBill: (bill: RecurringBill, payment: RecurringBillPayment) => Promise<void>;
}

export const RecurringBillsManager: React.FC<RecurringBillsProps> = ({
  bills,
  transactions,
  activeMonth,
  onSaveBills,
  onPayBill,
}) => {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [form, setForm] = useState<BillForm>(emptyForm);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalTodayISO());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(Boolean(dialog), dialogRef);

  const today = getLocalTodayISO();
  const occurrences = useMemo(
    () => getUnpaidBillOccurrences(bills, activeMonth, today, new Set(transactions.map((transaction) => transaction.id))),
    [bills, transactions, activeMonth, today]
  );

  const openNewBill = () => {
    setForm(emptyForm);
    setFormError("");
    setDialog({ type: "edit" });
  };

  const openEditBill = (bill: RecurringBill) => {
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      category: bill.category,
      recurrence: bill.recurrence,
      dueDay: String(bill.dueDay),
      dueMonth: String(bill.dueMonth ?? 1),
      estimated: bill.estimated,
    });
    setFormError("");
    setDialog({ type: "edit", bill });
  };

  const saveBill = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    const amount = Number(form.amount);
    const dueDay = Number(form.dueDay);
    const dueMonth = Number(form.dueMonth);
    if (!name || !Number.isFinite(amount) || amount <= 0) {
      setFormError(t("bills.invalidNameAmount"));
      return;
    }
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31 || (form.recurrence === "yearly" && (!Number.isInteger(dueMonth) || dueMonth < 1 || dueMonth > 12))) {
      setFormError(t("bills.invalidDueDate"));
      return;
    }
    const editingBill = dialog?.type === "edit" ? dialog.bill : undefined;
    const [year, activeMonthNumber] = activeMonth.split("-").map(Number);
    let startYear = year;
    let startMonth = form.recurrence === "yearly" ? dueMonth : activeMonthNumber;
    let startsOn = occurrenceDate(startYear, startMonth, dueDay);
    if (!editingBill && activeMonth === today.slice(0, 7) && startsOn < today) {
      if (form.recurrence === "yearly") {
        startYear += 1;
      } else if (startMonth === 12) {
        startYear += 1;
        startMonth = 1;
      } else {
        startMonth += 1;
      }
      startsOn = occurrenceDate(startYear, startMonth, dueDay);
    }
    const nextBill: RecurringBill = {
      id: editingBill?.id || crypto.randomUUID(),
      name,
      amount,
      category: form.category,
      recurrence: form.recurrence,
      dueDay,
      ...(form.recurrence === "yearly" ? { dueMonth } : {}),
      startsOn: editingBill && editingBill.recurrence === form.recurrence && editingBill.dueDay === dueDay && editingBill.dueMonth === (form.recurrence === "yearly" ? dueMonth : undefined)
        ? editingBill.startsOn
        : startsOn,
      estimated: form.estimated,
      active: true,
      payments: editingBill?.payments || [],
    };
    const next = editingBill
      ? bills.map((bill) => bill.id === nextBill.id ? nextBill : bill)
      : [...bills, nextBill];
    onSaveBills(next);
    setDialog(null);
  };

  const removeBill = (bill: RecurringBill) => {
    if (!window.confirm(t("bills.deleteConfirm", { name: bill.name }))) return;
    onSaveBills(bills.filter((item) => item.id !== bill.id));
  };

  const openPayment = (occurrence: BillOccurrence) => {
    setPaymentAmount(String(occurrence.bill.amount));
    setPaymentDate(today);
    setFormError("");
    setDialog({ type: "pay", occurrence });
  };

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (dialog?.type !== "pay") return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(t("bills.invalidPaymentAmount"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payment: RecurringBillPayment = {
        dueDate: dialog.occurrence.dueDate,
        paidOn: paymentDate,
        amount,
        transactionId: crypto.randomUUID(),
      };
      await onPayBill(dialog.occurrence.bill, payment);
      setDialog(null);
    } catch {
      setFormError(t("bills.paymentFailed"));
    } finally {
      setSaving(false);
    }
  };

  const formDialog = dialog?.type === "edit";
  const paymentDialog = dialog?.type === "pay";

  return (
    <section className="space-y-4" aria-label={t("bills.title")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--color-ink)]">
            <CalendarDots size={20} weight="duotone" className="text-[var(--primary)]" />
            {t("bills.title")}
          </h2>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("bills.subtitle")}</p>
        </div>
        <button type="button" onClick={openNewBill} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1C5954] px-3 py-2 text-xs font-bold text-[#FEFFFC] shadow-xs transition hover:opacity-90 dark:bg-[#76AA9D] dark:text-[#071B1A]">
          <Plus size={15} weight="bold" /> {t("bills.add")}
        </button>
      </div>

      {bills.filter((bill) => bill.active).length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
          <Receipt size={24} className="mx-auto mb-2 opacity-60" />
          {t("bills.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {bills.filter((bill) => bill.active).map((bill) => {
            const nextOccurrence = occurrences.find((occurrence) => occurrence.bill.id === bill.id);
            return (
              <article key={bill.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 sm:flex sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-[var(--color-ink)]">{bill.name}</h3>
                    <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">{t(`category.${bill.category}`)}</span>
                    {bill.estimated && <span className="rounded-full border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--amber-ink)]">{t("bills.estimated")}</span>}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                    {t(bill.recurrence === "monthly" ? "bills.monthly" : "bills.yearly")}
                    {nextOccurrence ? ` · ${nextOccurrence.overdue ? t("bills.overdue") : t("bills.dueOn", { date: formatDate(nextOccurrence.dueDate) })}` : ` · ${t("bills.currentPeriodPaid")}`}
                  </p>
                  {nextOccurrence && <p className={`mt-1 text-xs font-semibold ${nextOccurrence.overdue ? "text-[var(--rose-ink)]" : "text-[var(--color-ink-soft)]"}`}>{t("bills.unpaidOccurrence", { date: nextOccurrence.dueDate })}</p>}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 sm:mt-0 sm:justify-end">
                  <span className="whitespace-nowrap font-mono text-sm font-bold text-[var(--color-ink)]">฿{thb.format(bill.amount)}</span>
                  <div className="flex items-center gap-1">
                    {nextOccurrence && <button type="button" onClick={() => openPayment(nextOccurrence)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--jade)]/40 bg-[var(--jade-soft)] px-2.5 py-1.5 text-xs font-bold text-[var(--jade-ink)] transition hover:opacity-80"><CheckCircle size={14} weight="fill" />{t("bills.markPaid")}</button>}
                    <button type="button" aria-label={t("bills.edit", { name: bill.name })} onClick={() => openEditBill(bill)} className="rounded-lg p-2 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]"><PencilSimple size={15} /></button>
                    <button type="button" aria-label={t("bills.delete", { name: bill.name })} onClick={() => removeBill(bill)} className="rounded-lg p-2 text-[var(--color-ink-soft)] transition hover:bg-[var(--rose-soft)] hover:text-[var(--rose-ink)]"><Trash size={15} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(event) => { if (event.key === "Escape" && !saving) setDialog(null); }}>
          <button type="button" aria-label={t("ux.close")} onClick={() => setDialog(null)} className="fixed inset-0 cursor-default bg-black/40 backdrop-blur-xs" />
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bill-dialog-title" tabIndex={-1} className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-5 py-4">
              <h2 id="bill-dialog-title" className="text-base font-bold text-[var(--color-ink)]">
                {formDialog ? (dialog.bill ? t("bills.editTitle") : t("bills.addTitle")) : t("bills.paymentTitle", { name: paymentDialog ? dialog.occurrence.bill.name : "" })}
              </h2>
              <button type="button" aria-label={t("ux.close")} onClick={() => setDialog(null)} className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-line-subtle)]"><X size={18} /></button>
            </div>
            {formDialog ? (
              <form onSubmit={saveBill} className="space-y-4 p-5">
                <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.name")}</span><input autoFocus required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]" /></label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.amount")}</span><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-ink)]" /></label>
                  <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("quickAdd.categoryLabel")}</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as BillForm["category"] })} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]">{billCategories.map((category) => <option key={category} value={category}>{t(`category.${category}`)}</option>)}</select></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.frequency")}</span><select value={form.recurrence} onChange={(event) => setForm({ ...form, recurrence: event.target.value as BillForm["recurrence"] })} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]"><option value="monthly">{t("bills.monthly")}</option><option value="yearly">{t("bills.yearly")}</option></select></label>
                  <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.dueDay")}</span><input required type="number" min="1" max="31" value={form.dueDay} onChange={(event) => setForm({ ...form, dueDay: event.target.value })} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]" /></label>
                </div>
                {form.recurrence === "yearly" && <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.dueMonth")}</span><select value={form.dueMonth} onChange={(event) => setForm({ ...form, dueMonth: event.target.value })} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{t(`calendar.months.${month - 1}`)}</option>)}</select></label>}
                <label className="flex items-start gap-2 text-xs text-[var(--color-ink-soft)]"><input type="checkbox" checked={form.estimated} onChange={(event) => setForm({ ...form, estimated: event.target.checked })} className="mt-0.5" /><span>{t("bills.estimatedHelp")}</span></label>
                {formError && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{formError}</p>}
                <div className="flex justify-end gap-2 border-t border-[var(--color-line)] pt-4"><button type="button" onClick={() => setDialog(null)} className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)]">{t("quickAdd.cancel")}</button><button type="submit" className="rounded-lg bg-[#1C5954] px-3 py-2 text-xs font-bold text-white dark:bg-[#76AA9D] dark:text-[#071B1A]">{t("bills.save")}</button></div>
              </form>
            ) : paymentDialog && (
              <form onSubmit={submitPayment} className="space-y-4 p-5">
                <p className="text-sm text-[var(--color-ink-soft)]">{t("bills.paymentHelp", { dueDate: dialog.occurrence.dueDate })}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.actualAmount")}</span><input autoFocus required type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-ink)]" /></label>
                  <label className="block space-y-1 text-xs font-semibold text-[var(--color-ink-soft)]"><span>{t("bills.paidOn")}</span><input required type="date" max={today} value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)]" /></label>
                </div>
                {formError && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{formError}</p>}
                <div className="flex justify-end gap-2 border-t border-[var(--color-line)] pt-4"><button type="button" onClick={() => setDialog(null)} disabled={saving} className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)]">{t("quickAdd.cancel")}</button><button type="submit" disabled={saving} className="rounded-lg bg-[#1C5954] px-3 py-2 text-xs font-bold text-white disabled:opacity-60 dark:bg-[#76AA9D] dark:text-[#071B1A]">{saving ? t("ux.saving") : t("bills.confirmPayment")}</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export const UpcomingBillsSummary: React.FC<{
  bills: RecurringBill[];
  transactions: Transaction[];
  activeMonth: string;
  setActiveTab: (tab: ViewTab) => void;
}> = ({ bills, transactions, activeMonth, setActiveTab }) => {
  const { t } = useTranslation();
  const today = getLocalTodayISO();
  const occurrences = useMemo(() => getUnpaidBillOccurrences(bills, activeMonth, today, new Set(transactions.map((transaction) => transaction.id))), [bills, transactions, activeMonth, today]);
  const visible = occurrences.slice(-4).reverse();
  if (bills.filter((bill) => bill.active).length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4" aria-label={t("bills.upcoming")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]"><CalendarDots size={18} weight="duotone" className="text-[var(--primary)]" />{t("bills.upcoming")}</h2>
        <button type="button" onClick={() => setActiveTab("budget")} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-ink)] hover:underline">{t("bills.manage")}<ArrowRight size={13} /></button>
      </div>
      {visible.length === 0 ? (
        <p className="mt-3 rounded-xl bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--color-ink-soft)]">{t("bills.allPaid")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((occurrence) => (
            <div key={`${occurrence.bill.id}-${occurrence.dueDate}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2">
              <div className="min-w-0"><p className="truncate text-xs font-semibold text-[var(--color-ink)]">{occurrence.bill.name}</p><p className={`text-[10px] ${occurrence.overdue ? "font-semibold text-[var(--rose-ink)]" : "text-[var(--color-ink-soft)]"}`}>{occurrence.overdue ? t("bills.overdue") : t("bills.dueOn", { date: formatDate(occurrence.dueDate) })}{occurrence.bill.estimated ? ` · ${t("bills.estimated")}` : ""}</p></div>
              <span className="whitespace-nowrap font-mono text-xs font-bold text-[var(--color-ink)]">฿{thb.format(occurrence.bill.amount)}</span>
            </div>
          ))}
          {occurrences.length > visible.length && <p className="text-right text-[10px] text-[var(--color-ink-soft)]">{t("bills.moreUnpaid", { count: occurrences.length - visible.length })}</p>}
        </div>
      )}
    </section>
  );
};
