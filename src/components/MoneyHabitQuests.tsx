import React from "react";
import { CheckCircle, Circle, Scales, Sparkle, Target } from "./icons";
import { useTranslation } from "react-i18next";
import { useCategories } from "../hooks/useCategories";
import type { Account, Transaction } from "../types";
import {
  MONTH_LIMITS_XP,
  WEEKLY_CHECK_XP,
  monthWithinLimitsStatus,
  weeklyBalanceCheckStatus,
} from "../utils/systemQuests";
import { getLocalTodayISO, getDaysInMonth } from "../utils/safeToSpend";

interface MoneyHabitQuestsProps {
  accounts: Account[];
  transactions: Transaction[];
  compact?: boolean;
}

/** Quests checked against real data: they complete themselves and cannot be ticked by hand. */
export const MoneyHabitQuests: React.FC<MoneyHabitQuestsProps> = ({ accounts, transactions, compact }) => {
  const { t } = useTranslation();
  const categories = useCategories();
  const today = getLocalTodayISO();
  const month = today.slice(0, 7);
  const weekly = weeklyBalanceCheckStatus(accounts, today);
  const limits = monthWithinLimitsStatus(categories.list, transactions, month);
  const [year, monthNumber] = month.split("-").map(Number);
  const daysLeft = getDaysInMonth(year, monthNumber) - Number(today.slice(8)) + 1;

  const rows = [
    {
      id: "weekly",
      icon: <Scales size={18} weight="duotone" />,
      title: t("quests.system.weeklyTitle"),
      status: weekly.done ? t("quests.system.weeklyDone") : t("quests.system.weeklyTodo"),
      done: weekly.done,
      xp: WEEKLY_CHECK_XP,
      tone: weekly.done ? "jade" : "neutral",
    },
    {
      id: "limits",
      icon: <Target size={18} weight="duotone" />,
      title: t("quests.system.limitsTitle"),
      status: !limits.hasLimits
        ? t("quests.system.limitsNone")
        : limits.overCount > 0
          ? t("quests.system.limitsOver", { count: limits.overCount })
          : t("quests.system.limitsOnTrack", { days: daysLeft }),
      done: false, // Judged when the month ends; the reward arrives at the start of next month
      xp: MONTH_LIMITS_XP,
      tone: !limits.hasLimits ? "neutral" : limits.overCount > 0 ? "rose" : "jade",
    },
  ] as const;

  const toneClass = { jade: "text-[var(--jade-ink)]", rose: "text-[var(--rose-ink)]", neutral: "text-[var(--color-ink-soft)]" };

  return (
    <section aria-label={t("quests.system.title")} className="space-y-2">
      {!compact && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">{t("quests.system.title")}</h4>
          <p className="text-xs text-[var(--color-ink-soft)]">{t("quests.system.subtitle")}</p>
        </div>
      )}
      {rows.map((row) => (
        <div
          key={row.id}
          className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${row.done ? "border-[var(--jade)]/30 bg-[var(--jade-soft)]/50" : "border-[var(--color-line)] bg-[var(--color-surface)]"}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            {row.done
              ? <CheckCircle size={20} weight="fill" className="shrink-0 text-[var(--jade)]" aria-label={t("quests.system.completed")} />
              : <Circle size={20} weight="duotone" className="shrink-0 text-[var(--color-ink-soft)]" aria-hidden />}
            <span className="shrink-0 text-[var(--primary)]" aria-hidden>{row.icon}</span>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-[var(--color-ink)]">{row.title}</span>
              <span className={`block text-xs ${toneClass[row.tone]}`}>{row.status}</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--jade)]/25 bg-[var(--jade-soft)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--jade-ink)]">
            <Sparkle size={12} weight="fill" aria-hidden /> +{row.xp} XP
          </span>
        </div>
      ))}
    </section>
  );
};
