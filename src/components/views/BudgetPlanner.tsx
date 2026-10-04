import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  MagicWand,
  Scales,
  WarningCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import {
  BUCKET_COLORS,
  CATEGORY_BUCKET_MAP,
  CATEGORY_COLORS,
  type Allocation,
  type BudgetBucket,
  type Transaction,
} from "../../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface BudgetPlannerProps {
  income: number;
  setIncome: (val: number | ((prev: number) => number)) => void;
  allocations: Allocation[];
  setAllocations: (val: Allocation[] | ((prev: Allocation[]) => Allocation[])) => void;
  transactions: Transaction[];
  activeMonth: string;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  income,
  setIncome,
  allocations,
  setAllocations,
  transactions,
  activeMonth,
}) => {
  const { t } = useTranslation();

  const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
  const isBalanced = totalPercent === 100;

  // Filter transactions for this month
  const monthTxs = transactions.filter((t) => t.date.startsWith(activeMonth));

  // Compute actual spent per bucket and category
  const bucketActuals: Record<BudgetBucket, number> = {
    Needs: 0,
    Wants: 0,
    Savings: 0,
  };

  const categoryActuals: Record<string, number> = {};

  monthTxs
    .filter((tx) => tx.amount < 0)
    .forEach((tx) => {
      if (tx.category !== "Income") {
        const bucket = CATEGORY_BUCKET_MAP[tx.category] || "Wants";
        const absAmount = Math.abs(tx.amount);
        bucketActuals[bucket] += absAmount;
        categoryActuals[tx.category] = (categoryActuals[tx.category] || 0) + absAmount;
      }
    });

  const updatePercent = (id: string, newPercent: number) => {
    setAllocations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, percent: newPercent } : item))
    );
  };

  const apply503020 = () => {
    setAllocations([
      { id: "needs", label: "Needs", percent: 50, color: BUCKET_COLORS.Needs },
      { id: "wants", label: "Wants", percent: 30, color: BUCKET_COLORS.Wants },
      { id: "savings", label: "Savings", percent: 20, color: BUCKET_COLORS.Savings },
    ]);
  };

  const autoBalance = () => {
    if (totalPercent === 0) return;
    const factor = 100 / totalPercent;
    let sum = 0;
    const updated = allocations.map((item, idx) => {
      if (idx === allocations.length - 1) {
        return { ...item, percent: Math.max(0, 100 - sum) };
      }
      const val = Math.round(item.percent * factor);
      sum += val;
      return { ...item, percent: val };
    });
    setAllocations(updated);
  };

  // Prepare comparison data for Recharts
  const comparisonData = (["Needs", "Wants", "Savings"] as const).map((bucketKey) => {
    const alloc = allocations.find((a) => a.label.toLowerCase().includes(bucketKey.toLowerCase()));
    const percent = alloc ? alloc.percent : bucketKey === "Needs" ? 50 : bucketKey === "Wants" ? 30 : 20;
    const planned = Math.round((income * percent) / 100);
    const actual = bucketActuals[bucketKey];

    return {
      bucket: t(`alloc.${bucketKey}`),
      Planned: planned,
      Actual: actual,
      color: BUCKET_COLORS[bucketKey],
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Income Config Card */}
      <BentoCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              {t("plan.title")}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
              {t("plan.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2 shadow-xs">
              <label className="text-xs font-semibold text-[var(--color-ink-soft)]">
                {t("plan.incomeLabel")}:
              </label>
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm font-bold text-[var(--primary-ink)]">฿</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={income}
                  onChange={(e) => setIncome(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-transparent font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={apply503020}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition shadow-xs"
            >
              <MagicWand size={15} weight="duotone" className="text-[var(--primary)]" />
              <span>{t("plan.preset503020")}</span>
            </button>

            {!isBalanced && (
              <button
                type="button"
                onClick={autoBalance}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3 py-2 text-xs font-semibold hover:opacity-90 transition shadow-xs"
              >
                <Scales size={15} />
                <span>{t("plan.autoBalance")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Balance Status Pill */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-xs">
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--jade-ink)]">
                <CheckCircle size={16} weight="fill" className="text-[var(--jade)]" />
                {t("plan.balanced")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--rose-ink)]">
                <WarningCircle size={16} weight="fill" className="text-[var(--rose)]" />
                {t("plan.unbalanced", { total: totalPercent })}
              </span>
            )}
          </div>
          <span className="font-mono font-bold text-[var(--color-ink)]">
            Total Allocated: {totalPercent}%
          </span>
        </div>
      </BentoCard>

      {/* 3 Buckets Grid (Needs, Wants, Savings) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {(["Needs", "Wants", "Savings"] as const).map((bucketKey) => {
          const alloc = allocations.find((a) =>
            a.label.toLowerCase().includes(bucketKey.toLowerCase())
          );
          const percent = alloc ? alloc.percent : bucketKey === "Needs" ? 50 : bucketKey === "Wants" ? 30 : 20;
          const plannedAmount = Math.round((income * percent) / 100);
          const actualSpent = bucketActuals[bucketKey];
          const remaining = plannedAmount - actualSpent;
          const isOver = actualSpent > plannedAmount && plannedAmount > 0;
          const consumedPct =
            plannedAmount > 0
              ? Math.min(100, Math.round((actualSpent / plannedAmount) * 100))
              : 0;

          // Categories under this bucket
          const categoriesInBucket = Object.entries(CATEGORY_BUCKET_MAP)
            .filter(([_, b]) => b === bucketKey)
            .map(([cat]) => cat);

          return (
            <BentoCard
              key={bucketKey}
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: BUCKET_COLORS[bucketKey] }}
                    />
                    <h3 className="text-sm font-bold text-[var(--color-ink)]">
                      {t(`alloc.${bucketKey}`)} ({percent}%)
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--color-ink)]">
                    ฿{thb.format(plannedAmount)}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                  {t(`plan.help.${bucketKey}`)}
                </p>

                {/* Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    <span>Allocation Slider</span>
                    <span className="font-mono text-[var(--color-ink)] font-bold">{percent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percent}
                    onChange={(e) => {
                      if (alloc) updatePercent(alloc.id, parseInt(e.target.value, 10));
                    }}
                    className="w-full"
                  />
                </div>

                {/* Progress bar */}
                <div className="rounded-xl border border-[var(--color-line)] p-3 bg-[var(--color-surface-subtle)]">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--color-ink-soft)]">{t("plan.actualSpent")}:</span>
                    <span className={`font-mono font-bold ${isOver ? "text-[var(--rose-ink)]" : "text-[var(--color-ink)]"}`}>
                      ฿{thb.format(actualSpent)}
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

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[var(--color-ink-soft)]">{consumedPct}% of budget</span>
                    <span
                      className={`font-semibold ${
                        isOver ? "text-[var(--rose-ink)]" : "text-[var(--jade-ink)]"
                      }`}
                    >
                      {isOver
                        ? t("plan.overBudget", { amount: thb.format(actualSpent - plannedAmount) })
                        : `฿${thb.format(remaining)} ${t("plan.remaining")}`}
                    </span>
                  </div>
                </div>

                {/* Category breakdown under bucket */}
                <div className="pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
                    Included Categories
                  </div>
                  <div className="space-y-1.5">
                    {categoriesInBucket.map((cat) => {
                      const spent = categoryActuals[cat] || 0;
                      const catColor = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: catColor }} />
                            <span>{t(`category.${cat}`)}</span>
                          </div>
                          <span className="font-mono text-[var(--color-ink-soft)]">
                            ฿{thb.format(spent)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </BentoCard>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <BentoCard
        header={
          <div>
            <h3 className="text-sm font-bold text-[var(--color-ink)]">
              Planned Budget vs. Actual Outflow · {activeMonth}
            </h3>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Visual comparison between your target plan and verified month-to-date spending.
            </p>
          </div>
        }
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <XAxis dataKey="bucket" stroke="var(--color-ink-soft)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--color-ink-soft)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `฿${val / 1000}k`}
              />
              <Tooltip
                formatter={(value: any, name: any) => [`฿${thb.format(Number(value))}`, name]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--color-line)",
                  background: "var(--color-surface)",
                  color: "var(--color-ink)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  boxShadow: "var(--shadow-tile)",
                }}
                itemStyle={{ color: "var(--color-ink)" }}
                labelStyle={{ color: "var(--color-ink)", fontWeight: "bold" }}
              />
              <Legend />
              <Bar dataKey="Planned" fill="var(--color-line)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Actual" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </BentoCard>
    </div>
  );
};
