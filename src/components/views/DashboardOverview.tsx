import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChartLineUp,
  CalendarDots,
  CheckCircle,
  Circle,
  Coins,
  PiggyBank,
  Receipt,
  Scales,
  ShieldCheck,
  Sparkle,
  Wallet,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import { MetricTile } from "../common/MetricTile";
import { TactileButton } from "../common/TactileButton";
import { FloatingReward, type FloatingRewardItem } from "../common/FloatingReward";
import { UpcomingBillsSummary } from "../RecurringBills";
import { calculateDailySafeToSpend, getLocalTodayISO } from "../../utils/safeToSpend";
import {
  CATEGORY_BUCKET_MAP,
  CATEGORY_COLORS,
  type Allocation,
  type Quest,
  type RecurringBill,
  type SavingsGoal,
  type Transaction,
  type ViewTab,
} from "../../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface DashboardOverviewProps {
  transactions: Transaction[];
  allocations: Allocation[];
  quests: Quest[];
  income: number;
  activeMonth: string;
  setActiveTab: (tab: ViewTab) => void;
  onToggleQuest: (id: string) => void;
  onOpenQuickAdd: () => void;
  onOpenIncome?: () => void;
  savingsGoals?: SavingsGoal[];
  recurringBills: RecurringBill[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  allocations,
  quests,
  income,
  activeMonth,
  setActiveTab,
  onToggleQuest,
  onOpenQuickAdd,
  onOpenIncome,
  savingsGoals,
  recurringBills,
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [floatingRewards, setFloatingRewards] = useState<FloatingRewardItem[]>([]);

  // Filter transactions for the selected month
  const monthTransactions = transactions.filter((tx) => tx.date.startsWith(activeMonth));
  const monthIncome = monthTransactions
    .filter((tx) => tx.amount > 0 && tx.category === "Income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthExpenses = Math.abs(
    monthTransactions
      .filter((tx) => tx.amount < 0 && tx.category !== "Savings")
      .reduce((sum, tx) => sum + tx.amount, 0)
  );
  const netCashFlow = monthIncome - monthExpenses;
  const totalCount = monthTransactions.length;

  const netSaved = monthTransactions.filter(tx => tx.category === "Savings").reduce((sum, tx) => sum - tx.amount, 0);
  const savingsRate = monthIncome > 0 ? Math.round(netSaved / monthIncome * 100) : 0;

  // Compute actual spent per bucket
  const bucketActuals: Record<"Needs" | "Wants" | "Savings", number> = {
    Needs: 0,
    Wants: 0,
    Savings: netSaved,
  };

  monthTransactions
    .filter((tx) => tx.amount < 0 && tx.category !== "Savings")
    .forEach((tx) => {
      if (tx.category !== "Income") {
        const bucket = CATEGORY_BUCKET_MAP[tx.category] || "Wants";
        bucketActuals[bucket] += Math.abs(tx.amount);
      }
    });

  const recentTransactions = [...monthTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const completedQuests = quests.filter((q) => q.done).length;
  const today = getLocalTodayISO();
  const safeToSpend = calculateDailySafeToSpend(transactions, allocations, income, activeMonth, today, {
    recurringBills,
    savingsGoals,
  });
  const reservedPercent = safeToSpend.monthSpendableBudget > 0
    ? Math.min(100, Math.max(0, ((safeToSpend.monthSpent + safeToSpend.unpaidBillsTotal) / safeToSpend.monthSpendableBudget) * 100))
    : 100;

  const handleQuestClick = (quest: Quest, e: React.MouseEvent) => {
    if (!quest.done) {
      const newReward: FloatingRewardItem = {
        id: `${quest.id}-${Date.now()}`,
        text: `+${quest.xp} XP Completed!`,
        x: e.clientX,
        y: e.clientY,
      };
      setFloatingRewards((prev) => [...prev, newReward]);
    }
    onToggleQuest(quest.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("ux.moneySummary", { month: activeMonth })}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-soft)]">{t("ux.actualExplanation")}</p>
      </div>
      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4" aria-label={t("ux.reviewSpending")}>
        {monthIncome === 0 ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm">{t("ux.noIncome")}</p><button type="button" onClick={onOpenIncome || onOpenQuickAdd} className="rounded-lg bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3 py-2 text-sm font-semibold transition active:scale-[0.98] shadow-xs cursor-pointer">{t("ux.addIncome")}</button></div> : (() => {
          const exceeded = allocations.filter(allocation => {
            const bucket = allocation.label as keyof typeof bucketActuals;
            return bucket !== "Savings" && bucketActuals[bucket] > income * allocation.percent / 100;
          });
          return exceeded.length ? <div className="space-y-2">{exceeded.map(allocation => <div key={allocation.id} className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--rose-ink)]">{t("ux.overBudget", { bucket: t(`alloc.${allocation.label}`), amount: thb.format(bucketActuals[allocation.label as keyof typeof bucketActuals] - income * allocation.percent / 100) })}</p><button type="button" onClick={() => setActiveTab("ledger")} className="text-sm font-semibold underline transition active:scale-[0.98] cursor-pointer">{t("ux.reviewSpending")}</button></div>)}</div> : <p className="text-sm">{t("ux.allClear")}</p>;
        })()}
      </section>
      <FloatingReward
        rewards={floatingRewards}
        onComplete={(id) => {
          setFloatingRewards((prev) => prev.filter((r) => r.id !== id));
        }}
      />

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          icon={<ChartLineUp size={18} weight="duotone" />}
          label={t("metric.net")}
          numericValue={netCashFlow}
          prefix="฿"
          showSign={true}
          subtext={t("ux.flowExplanation")}
          tone={netCashFlow >= 0 ? "jade" : "rose"}
        />
        <MetricTile
          icon={<Coins size={18} weight="duotone" />}
          label={t("metric.income")}
          numericValue={monthIncome}
          prefix="฿"
          subtext={t("ux.expectedIncome", { amount: thb.format(income) })}
          tone="jade"
        />
        <MetricTile
          icon={<Receipt size={18} weight="duotone" />}
          label={t("metric.spent")}
          numericValue={monthExpenses}
          prefix="฿"
          subtext={t("ux.entryCount", { count: totalCount })}
          tone="rose"
        />
        <MetricTile
          icon={<PiggyBank size={18} weight="duotone" />}
          label={t("metric.savingsRate")}
          numericValue={monthIncome > 0 ? savingsRate : undefined}
          value={monthIncome > 0 ? undefined : "—"}
          suffix="%"
          subtext={t("ux.savedExplanation", { amount: thb.format(netSaved) })}
          tone={savingsRate >= 20 ? "jade" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <BentoCard className="lg:col-span-7" header={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--color-ink)]">
              <Wallet size={19} weight="duotone" className="text-[var(--primary)]" />
              {t("safeToSpend.dashboardTitle")}
            </h2>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${safeToSpend.status === "critical" ? "bg-[var(--rose-soft)] text-[var(--rose-ink)]" : safeToSpend.status === "caution" ? "bg-[var(--amber-soft)] text-[var(--amber-ink)]" : "bg-[var(--jade-soft)] text-[var(--jade-ink)]"}`}>
              {t(`safeToSpend.${safeToSpend.status}`)}
            </span>
          </div>
        }>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-soft)]">{t("safeToSpend.monthAvailable")}</p>
              <p className={`mt-1 font-mono text-3xl font-bold tracking-tight ${safeToSpend.shortfall > 0 ? "text-[var(--rose-ink)]" : "text-[var(--jade-ink)]"}`}>฿{thb.format(Math.max(0, safeToSpend.monthRemaining))}</p>
              {safeToSpend.shortfall > 0 && <p className="mt-1 text-xs font-semibold text-[var(--rose-ink)]">{t("safeToSpend.shortfall", { amount: thb.format(safeToSpend.shortfall) })}</p>}
              {safeToSpend.shortfall === 0 && <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("safeToSpend.daysLeft", { days: safeToSpend.daysRemainingInMonth })}</p>}
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 sm:text-right">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-ink-soft)] sm:justify-end"><CalendarDots size={13} />{activeMonth === today.slice(0, 7) ? t("safeToSpend.dailyAverage") : t("safeToSpend.monthLeft", { amount: "" }).replace(":", "")}</p>
              <p className="mt-1 font-mono text-lg font-bold text-[var(--color-ink)]">฿{thb.format(activeMonth === today.slice(0, 7) ? safeToSpend.dailySafeToSpend : Math.max(0, safeToSpend.monthRemaining))}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-line)]" aria-label={t("safeToSpend.progressDescription", { percent: Math.round(reservedPercent) })}>
            <motion.div className={`h-full w-full origin-left rounded-full ${safeToSpend.shortfall > 0 ? "bg-[var(--rose)]" : "bg-[var(--jade)]"}`} initial={shouldReduceMotion ? { scaleX: reservedPercent / 100 } : { scaleX: 0 }} animate={{ scaleX: reservedPercent / 100 }} transition={{ duration: shouldReduceMotion ? 0 : 0.35 }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div><p className="text-[var(--color-ink-soft)]">{t("safeToSpend.monthSpent")}</p><p className="mt-0.5 font-mono font-bold text-[var(--color-ink)]">฿{thb.format(safeToSpend.monthSpent)}</p></div>
            <div><p className="text-[var(--color-ink-soft)]">{t("safeToSpend.unpaidBills")}</p><p className="mt-0.5 font-mono font-bold text-[var(--color-ink)]">฿{thb.format(safeToSpend.unpaidBillsTotal)}</p></div>
            <div><p className="text-[var(--color-ink-soft)]">{t("safeToSpend.plannedSavings")}</p><p className="mt-0.5 font-mono font-bold text-[var(--color-ink)]">฿{thb.format(safeToSpend.plannedSavingsAmount)}</p></div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">{t("ux.budgetExplanation", { amount: thb.format(income) })}</p>
        </BentoCard>
        <div className="lg:col-span-5"><UpcomingBillsSummary bills={recurringBills} transactions={transactions} activeMonth={activeMonth} setActiveTab={setActiveTab} /></div>
      </div>

      {/* Bento Row 1: Budget Health & Daily Quests */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Budget Health Card (7 cols) */}
        <BentoCard
          className="lg:col-span-7"
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scales size={18} weight="duotone" className="text-[var(--primary)]" />
                <h3 className="text-sm font-bold tracking-tight text-[var(--color-ink)]">
                  {t("plan.title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("budget")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-ink)] hover:underline transition"
              >
                <span>{t("tabs.budget")}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {(["Needs", "Wants", "Savings"] as const).map((bucketKey) => {
              const alloc = allocations.find((a) => a.label.toLowerCase().includes(bucketKey.toLowerCase()));
              const percent = alloc ? alloc.percent : bucketKey === "Needs" ? 50 : bucketKey === "Wants" ? 30 : 20;
              const plannedBudget = Math.round((income * percent) / 100);
              const actual = bucketActuals[bucketKey];
              const consumedPct = plannedBudget > 0 ? Math.max(0, Math.min(100, Math.round((actual / plannedBudget) * 100))) : 0;
              const isOver = actual > plannedBudget && plannedBudget > 0;

              return (
                <div key={bucketKey} className="rounded-xl border border-[var(--color-line)] p-3.5 bg-[var(--color-surface-subtle)]">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--color-ink)]">
                      {t(`alloc.${bucketKey}`)} ({percent}%)
                    </span>
                    <span className="font-mono text-[var(--color-ink)]">
                      ฿{thb.format(actual)}{" "}
                      <span className="text-[var(--color-ink-soft)] font-normal">
                        / ฿{thb.format(plannedBudget)}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? "bg-[var(--rose)]"
                          : bucketKey === "Needs"
                          ? "bg-[var(--primary)]"
                          : bucketKey === "Wants"
                          ? "bg-[var(--moss)]"
                          : "bg-[var(--jade)]"
                      }`}
                      style={{ width: `${consumedPct}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                    <span>{t("ux.budgetUsed", { amount: consumedPct })}</span>
                    <span className={isOver ? "font-bold text-[var(--rose-ink)]" : ""}>
                      {isOver
                        ? t("plan.overBudget", { amount: thb.format(actual - plannedBudget) })
                        : `฿${thb.format(plannedBudget - actual)} ${t("plan.remaining")}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </BentoCard>

        {/* Daily Quests Widget (5 cols) */}
        <BentoCard
          className="lg:col-span-5"
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-[var(--amber)]" />
                <h3 className="text-sm font-bold tracking-tight text-[var(--color-ink)]">
                  {t("quests.title")}
                </h3>
              </div>
              <span className="rounded-full bg-[var(--jade-soft)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--jade-ink)] border border-[var(--jade)]/30">
                {completedQuests}/{quests.length}
              </span>
            </div>
          }
        >
          <div className="space-y-2.5">
            {quests.slice(0, 3).map((quest) => (
              <div
                key={quest.id}
                onClick={(e) => handleQuestClick(quest, e)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                  quest.done
                    ? "border-[var(--jade)]/30 bg-[var(--jade-soft)]/50 text-[var(--color-ink-soft)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-ink)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {quest.done ? (
                    <CheckCircle size={20} weight="fill" className="text-[var(--jade)] shrink-0" />
                  ) : (
                    <Circle size={20} weight="duotone" className="text-[var(--color-ink-soft)] shrink-0" />
                  )}
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        quest.done ? "line-through text-[var(--color-ink-soft)] opacity-70" : "text-[var(--color-ink)]"
                      }`}
                    >
                      {quest.title}
                    </div>
                    <div className="font-mono text-xs text-[var(--color-ink-soft)]">
                      {quest.date}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[var(--jade-ink)] bg-[var(--jade-soft)] px-2 py-0.5 rounded-md border border-[var(--jade)]/25 shrink-0">
                  +{quest.xp} XP
                </span>
              </div>
            ))}

            {quests.length === 0 && (
              <div className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center text-xs text-[var(--color-ink-soft)]">
                {t("quests.empty")}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--color-line)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("quests")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-ink)] hover:underline transition"
            >
              <span>{t("tabs.quests")}</span>
              <ArrowRight size={13} />
            </button>
            <TactileButton
              type="button"
              onClick={onOpenQuickAdd}
              className="rounded-lg bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3 py-1.5 text-xs font-bold hover:opacity-90 transition shadow-xs"
            >
              + {t("header.quickAdd")}
            </TactileButton>
          </div>
        </BentoCard>
      </div>

      {/* Bento Row 2: Active Savings Goals Widget */}
      {savingsGoals && savingsGoals.length > 0 && (
        <BentoCard
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank size={18} weight="fill" className="text-[var(--jade)]" />
                <h3 className="text-sm font-bold tracking-tight text-[var(--color-ink)]">
                  {t("tabs.savings")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("savings")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-ink)] hover:underline transition"
              >
                <span>{t("tabs.savings")}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savingsGoals.slice(0, 3).map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100));
              return (
                <div
                  key={goal.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveTab("savings"); } }}
                  onClick={() => setActiveTab("savings")}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)]/60 p-3 hover:bg-[var(--color-surface-subtle)] cursor-pointer transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--color-ink)] mb-1">
                    <span className="truncate">{goal.title}</span>
                    <span className="font-mono text-[var(--jade-ink)]">{pct}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1C5954] to-[#4D8E75] dark:from-[#76AA9D] dark:to-[#8BB999]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-[var(--color-ink-soft)]">
                    <span>฿{thb.format(goal.currentAmount)}</span>
                    <span>฿{thb.format(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </BentoCard>
      )}

      {/* Bento Row 3: Recent Activity Ledger Feed */}
      <BentoCard
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-sm sm:text-base font-bold tracking-tight"
                style={{ color: 'var(--ink)' }}
              >
                {t("expense.title")} · {activeMonth}
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                {t("expense.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition shadow-xs"
            >
              <span>{t("tabs.ledger")}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                <th className="py-2.5 px-3">{t("expense.name")}</th>
                <th className="py-2.5 px-3">{t("expense.category")}</th>
                <th className="py-2.5 px-3">{t("expense.date")}</th>
                <th className="py-2.5 px-3 text-right">{t("expense.amount")}</th>
                <th className="py-2.5 px-3 text-center">{t("expense.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {recentTransactions.map((row) => {
                const isPositive = row.amount >= 0;
                const catColor = CATEGORY_COLORS[row.category] || "var(--color-line)";
                return (
                  <tr key={row.id} className="hover:bg-[var(--color-surface-subtle)] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[var(--color-ink)]">
                      <div className="flex items-center gap-2">
                        <span>{row.name}</span>
                        {row.notes && (
                          <span className="rounded-sm bg-[var(--color-surface-subtle)] px-1 py-0.2 text-xs text-[var(--color-ink-soft)] font-normal border border-[var(--color-line)]">
                            {row.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium border border-[var(--color-line)] bg-[var(--color-surface)] text-xs">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                        {t(`category.${row.category}`)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--color-ink-soft)] whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right whitespace-nowrap">
                      <span className={isPositive ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"}>
                        {isPositive ? "+" : "-"}฿{thb.format(Math.abs(row.amount))}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {row.cleared ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--jade-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--jade-ink)] border border-[var(--jade)]/30">
                          <ShieldCheck size={12} weight="fill" />
                          {t("expense.cleared")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--amber-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--amber-ink)] border border-[var(--amber)]/30">
                          {t("expense.pending")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {recentTransactions.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--color-ink-soft)]">
              {t("expense.emptyTitle")}
            </div>
          )}
        </div>
      </BentoCard>
    </div>
  );
};
