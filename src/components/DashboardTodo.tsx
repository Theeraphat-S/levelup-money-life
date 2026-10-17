import React, { useMemo } from "react";
import { CalendarDots, CheckCircle, Coins, CreditCard, ListChecks, Scales, WarningCircle } from "./icons";
import { useTranslation } from "react-i18next";
import { useCategories } from "../hooks/useCategories";
import type { Account, RecurringBill, Transaction, ViewTab } from "../types";
import type { CardBillOccurrence } from "../utils/cardBills";
import { computeCategoryBudgets } from "../utils/categories";
import { getUnpaidBillOccurrences } from "../utils/recurringBills";
import { getLocalTodayISO } from "../utils/safeToSpend";
import { BentoCard } from "./common/BentoCard";
import { CategoryIcon } from "./common/CategoryIcon";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const BALANCE_CHECK_DAYS = 7;
const MAX_ITEMS = 6;

export type BucketOverage = { bucket: string; amount: number };

type TodoItem = {
  key: string;
  tone: "rose" | "amber" | "neutral";
  icon: React.ReactNode;
  text: string;
  actionLabel: string;
  onAction: () => void;
  rank: number; // Lower shows first
};

interface DashboardTodoProps {
  activeMonth: string;
  transactions: Transaction[];
  monthIncome: number;
  overages: BucketOverage[];
  recurringBills: RecurringBill[];
  cardBills: CardBillOccurrence[];
  accounts: Account[];
  setActiveTab: (tab: ViewTab) => void;
  onOpenIncome: () => void;
  onOpenAccounts: () => void;
}

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000);
}

/** What needs attention this month, most urgent first — guidance, not a scolding. */
export const DashboardTodo: React.FC<DashboardTodoProps> = ({
  activeMonth,
  transactions,
  monthIncome,
  overages,
  recurringBills,
  cardBills,
  accounts,
  setActiveTab,
  onOpenIncome,
  onOpenAccounts,
}) => {
  const { t } = useTranslation();
  const categories = useCategories();
  const today = getLocalTodayISO();

  const items = useMemo(() => {
    const list: TodoItem[] = [];
    const toBudget = () => setActiveTab("budget");

    if (monthIncome === 0) {
      list.push({ key: "income", tone: "neutral", rank: 3, icon: <Coins size={16} weight="duotone" />, text: t("ux.noIncome"), actionLabel: t("ux.addIncome"), onAction: onOpenIncome });
    }

    for (const overage of overages) {
      list.push({
        key: `bucket-${overage.bucket}`,
        tone: "rose",
        rank: 1,
        icon: <WarningCircle size={16} weight="fill" />,
        text: t("ux.overBudget", { bucket: t(`alloc.${overage.bucket}`), amount: thb.format(overage.amount) }),
        actionLabel: t("ux.reviewSpending"),
        onAction: () => setActiveTab("ledger"),
      });
    }

    for (const status of computeCategoryBudgets(categories.list, transactions, activeMonth)) {
      if (status.level === "ok") continue;
      const name = categories.label(status.id);
      list.push({
        key: `limit-${status.id}`,
        tone: status.level === "over" ? "rose" : "amber",
        rank: status.level === "over" ? 1 : 2,
        icon: <CategoryIcon category={status.id} size={16} />,
        text: status.level === "over"
          ? t("dashboard.limitOver", { name, amount: thb.format(status.spent - status.limit) })
          : t("dashboard.limitNear", { name, percent: Math.round(status.ratio * 100) }),
        actionLabel: t("tabs.budget"),
        onAction: toBudget,
      });
    }

    const transactionIds = new Set(transactions.map((tx) => tx.id));
    for (const occurrence of getUnpaidBillOccurrences(recurringBills, activeMonth, today, transactionIds)) {
      list.push({
        key: `bill-${occurrence.bill.id}-${occurrence.dueDate}`,
        tone: occurrence.overdue ? "rose" : "neutral",
        rank: occurrence.overdue ? 0 : 4,
        icon: <CalendarDots size={16} weight="duotone" />,
        text: occurrence.overdue
          ? t("dashboard.billOverdue", { name: occurrence.bill.name, amount: thb.format(occurrence.bill.amount) })
          : t("dashboard.billDue", { name: occurrence.bill.name, amount: thb.format(occurrence.bill.amount), date: occurrence.dueDate }),
        actionLabel: t("bills.markPaid"),
        onAction: toBudget,
      });
    }

    for (const cardBill of cardBills.filter((bill) => bill.remaining > 0)) {
      const name = t("bills.cardBillName", { name: cardBill.account.name });
      list.push({
        key: `card-${cardBill.account.id}-${cardBill.dueDate}`,
        tone: cardBill.overdue ? "rose" : "neutral",
        rank: cardBill.overdue ? 0 : 4,
        icon: <CreditCard size={16} weight="duotone" />,
        text: cardBill.overdue
          ? t("dashboard.billOverdue", { name, amount: thb.format(cardBill.remaining) })
          : t("dashboard.billDue", { name, amount: thb.format(cardBill.remaining), date: cardBill.dueDate }),
        actionLabel: t("bills.payCard"),
        onAction: toBudget,
      });
    }

    // Nudge a balance check once the app has data and an account has not been verified for a week
    if (transactions.length > 0) {
      const stale = accounts.filter((a) => !a.archived && (!a.lastBalanceCheck || daysBetween(a.lastBalanceCheck, today) >= BALANCE_CHECK_DAYS));
      if (stale.length > 0) {
        list.push({
          key: "balance-check",
          tone: "neutral",
          rank: 5,
          icon: <Scales size={16} weight="duotone" />,
          text: t("dashboard.balanceCheck", { count: stale.length, days: BALANCE_CHECK_DAYS }),
          actionLabel: t("accounts.check"),
          onAction: onOpenAccounts,
        });
      }
    }

    return list.sort((a, b) => a.rank - b.rank);
  }, [t, categories, transactions, activeMonth, monthIncome, overages, recurringBills, cardBills, accounts, today, setActiveTab, onOpenIncome, onOpenAccounts]);

  const visible = items.slice(0, MAX_ITEMS);
  const toneClass = { rose: "text-[var(--rose-ink)]", amber: "text-[var(--amber-ink)]", neutral: "text-[var(--color-ink)]" } as const;

  return (
    <BentoCard
      className="h-full"
      header={
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--color-ink)]">
          <ListChecks size={19} weight="duotone" className="text-[var(--primary)]" />
          {t("dashboard.todoTitle")}
          {items.length > 0 && <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--color-ink-soft)]">{items.length}</span>}
        </h2>
      }
    >
      {visible.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl bg-[var(--jade-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--jade-ink)]">
          <CheckCircle size={18} weight="fill" aria-hidden />
          {t("ux.allClear")}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2">
              <span className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${toneClass[item.tone]}`}>
                <span className="shrink-0" aria-hidden>{item.icon}</span>
                <span>{item.text}</span>
              </span>
              <button type="button" onClick={item.onAction} className="shrink-0 text-xs font-semibold text-[var(--primary-ink)] underline-offset-2 transition hover:underline">
                {item.actionLabel}
              </button>
            </li>
          ))}
          {items.length > visible.length && (
            <li className="text-right text-xs text-[var(--color-ink-soft)]">{t("dashboard.moreTodo", { count: items.length - visible.length })}</li>
          )}
        </ul>
      )}
    </BentoCard>
  );
};
