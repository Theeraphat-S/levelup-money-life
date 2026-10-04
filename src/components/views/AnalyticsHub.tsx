import React, { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartBar,
  ChartPie,
  Fire,
  Lightbulb,
  PiggyBank,
  Receipt,
  TrendDown,
  TrendUp,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import { MetricTile } from "../common/MetricTile";
import {
  CATEGORY_COLORS,
  CHART_PALETTE,
  type Transaction,
  type TransactionCategory,
} from "../../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface AnalyticsHubProps {
  transactions: Transaction[];
  activeMonth: string;
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
  transactions,
  activeMonth,
}) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<"donut" | "bar">("donut");

  const monthRows = transactions.filter((row) => row.date.startsWith(activeMonth));
  const income = monthRows
    .filter((row) => row.amount > 0 && row.category === "Income")
    .reduce((s, r) => s + r.amount, 0);
  const expenses = Math.abs(
    monthRows.filter((row) => row.amount < 0 && row.category !== "Savings").reduce((s, r) => s + r.amount, 0)
  );
  const net = income - expenses;

  // Days in month calculation for daily burn rate
  const [yearStr, monthStr] = activeMonth.split("-");
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();
  const burnRate = Math.round(expenses / (daysInMonth || 30));
  const netSaved = monthRows.filter(row => row.category === "Savings").reduce((sum, row) => sum - row.amount, 0);
  const savingsRate = income > 0 ? Math.round(netSaved / income * 100) : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  monthRows
    .filter((r) => r.amount < 0 && r.category !== "Savings")
    .forEach((r) => {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + Math.abs(r.amount);
    });

  const breakdown = Object.entries(categoryTotals)
    .map(([name, value], index) => ({
      name: name as TransactionCategory,
      displayName: t(`category.${name}`),
      value,
      color: CATEGORY_COLORS[name as TransactionCategory] || CHART_PALETTE[index % CHART_PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);

  const topCategory = breakdown.length > 0 ? breakdown[0] : null;
  const topPct = topCategory && expenses > 0 ? Math.round((topCategory.value / expenses) * 100) : 0;

  // Generate Smart Actionable Insights
  const insights: { text: string; type: "positive" | "warning" | "neutral" }[] = [];

  if (income > 0) {
    if (savingsRate >= 20) {
      insights.push({
        text: t("analytics.insightSavingsHigh", { rate: savingsRate }),
        type: "positive",
      });
    } else {
      insights.push({
        text: t("analytics.insightSavingsLow", { rate: savingsRate }),
        type: "warning",
      });
    }
  }

  if (topCategory && topPct > 40) {
    insights.push({
      text: t("analytics.insightTopCategory", { category: topCategory.displayName, pct: topPct }),
      type: "warning",
    });
  }

  if (net >= 0 && income > 0) {
    insights.push({
      text: t("analytics.insightBalanced"),
      type: "positive",
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          icon={<TrendUp size={18} weight="bold" />}
          label={t("metric.income")}
          value={`฿${thb.format(income)}`}
          tone="jade"
        />
        <MetricTile
          icon={<TrendDown size={18} weight="bold" />}
          label={t("metric.spent")}
          value={`฿${thb.format(expenses)}`}
          tone="rose"
        />
        <MetricTile
          icon={<PiggyBank size={18} weight="duotone" />}
          label={t("metric.savingsRate")}
          value={income > 0 ? `${savingsRate}%` : "—"}
          subtext={t("ux.savedExplanation", { amount: thb.format(netSaved) })}
          tone={savingsRate >= 20 ? "jade" : "amber"}
        />
        <MetricTile
          icon={<Fire size={18} weight="fill" />}
          label={t("metric.burnRate")}
          value={`฿${thb.format(burnRate)} / day`}
          tone="neutral"
        />
      </div>

      {/* Smart Financial Insights Tile */}
      {insights.length > 0 && (
        <BentoCard
          header={
            <div className="flex items-center gap-2">
              <Lightbulb size={18} weight="fill" className="text-[var(--amber)]" />
              <h3 className="text-sm font-bold text-[var(--color-ink)]">
                {t("analytics.insightsTitle")}
              </h3>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3.5 text-xs font-medium leading-relaxed ${
                  ins.type === "positive"
                    ? "border-[var(--jade)]/30 bg-[var(--jade-soft)] text-[var(--jade-ink)]"
                    : ins.type === "warning"
                    ? "border-[var(--amber)]/30 bg-[var(--amber-soft)] text-[var(--amber-ink)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-[var(--color-ink)]"
                }`}
              >
                {ins.text}
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* Category Breakdown Charts */}
      <BentoCard
        header={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-ink)]">
                {t("analytics.categoryBreakdown")} · {activeMonth}
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {topCategory
                  ? t("analytics.topCategory", {
                      category: topCategory.displayName,
                      amount: thb.format(topCategory.value),
                      pct: topPct,
                    })
                  : t("analytics.subtitle")}
              </p>
            </div>

            <div className="flex gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-1 shadow-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartType("donut")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  chartType === "donut"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <ChartPie size={14} />
                <span>{t("analytics.viewDonut")}</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  chartType === "bar"
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <ChartBar size={14} />
                <span>{t("analytics.viewBar")}</span>
              </button>
            </div>
          </div>
        }
      >
        {breakdown.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--color-ink-soft)]">
            {t("analytics.emptyChart")}
          </div>
        ) : (
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_320px]">
            {/* Chart Area */}
            <div className="relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "donut" ? (
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="value"
                      nameKey="displayName"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {breakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`฿${thb.format(Number(val))}`, name]}
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
                  </PieChart>
                ) : (
                  <BarChart data={breakdown} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <XAxis dataKey="displayName" stroke="var(--color-ink-soft)" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="var(--color-ink-soft)"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `฿${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [`฿${thb.format(Number(val))}`, name]}
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
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {breakdown.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>

              {chartType === "donut" && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    Total Outflow
                  </span>
                  <span
                    className="font-mono text-base sm:text-lg font-extrabold text-[var(--ink)]"
                    style={{ color: "var(--ink)" }}
                  >
                    ฿{thb.format(expenses)}
                  </span>
                </div>
              )}
            </div>

            {/* List breakdown */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {breakdown.map((item) => {
                const pct = expenses > 0 ? Math.round((item.value / expenses) * 100) : 0;
                return (
                  <div
                    key={item.name}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.displayName}
                      </span>
                      <span className="font-mono text-[var(--color-ink)] font-bold">
                        ฿{thb.format(item.value)}{" "}
                        <span className="text-[var(--color-ink-soft)] font-normal">({pct}%)</span>
                      </span>
                    </div>

                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </BentoCard>
    </div>
  );
};
