import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CaretLeft,
  CaretRight,
  Database,
  Desktop,
  Flame,
  Moon,
  Plus,
  Receipt,
  Sun,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { AppLogo } from "./AppLogo";
import { AnimatedCounter } from "./common/AnimatedCounter";
import { TactileButton } from "./common/TactileButton";
import type { GamificationState, ThemeMode, ViewTab } from "../types";

interface HeaderCommandDeckProps {
  gamification: GamificationState;
  activeMonth: string; // "YYYY-MM"
  setActiveMonth: (month: string) => void;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  onOpenQuickAdd: () => void;
  onOpenScanSlip: () => void;
  onOpenDataManager: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const HeaderCommandDeck: React.FC<HeaderCommandDeckProps> = ({
  gamification,
  activeMonth,
  setActiveMonth,
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenScanSlip,
  onOpenDataManager,
  themeMode,
  setThemeMode,
}) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const currentLang = i18n.language?.startsWith("th") ? "th" : "en";
  const currentMonthISO = new Date().toISOString().slice(0, 7);

  const prevMonth = () => {
    const [yearStr, monthStr] = activeMonth.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setActiveMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const [yearStr, monthStr] = activeMonth.split("-");
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setActiveMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  // Format Month Year nicely for display
  const monthDate = new Date(`${activeMonth}-01T00:00:00`);
  const formattedMonth = monthDate.toLocaleDateString(currentLang === "th" ? "th-TH" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const levelProgressPct = Math.min(
    100,
    Math.round((gamification.currentLevelXp / Math.max(1, gamification.xpForNextLevel)) * 100)
  );

  const tabs: { id: ViewTab; label: string }[] = [
    { id: "dashboard", label: t("tabs.dashboard") },
    { id: "ledger", label: t("tabs.ledger") },
    { id: "budget", label: t("tabs.budget") },
    { id: "savings", label: t("tabs.savings") },
    { id: "tax", label: t("tabs.tax") },
    { id: "analytics", label: t("tabs.analytics") },
    { id: "quests", label: t("tabs.quests") },
  ];

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: "light", icon: <Sun size={15} weight="bold" />, label: t("theme.light") },
    { mode: "dark", icon: <Moon size={15} weight="bold" />, label: t("theme.dark") },
    { mode: "system", icon: <Desktop size={15} weight="bold" />, label: t("theme.system") },
  ];

  return (
    <header className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-[var(--shadow-tile)] transition-all duration-300">
      {/* 1px Liquid Glass Highlight at the very top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

      {/* Top Utility Row */}
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between border-b border-[var(--color-line)] pb-5">
        {/* Left: Branding & Level Gamification Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <AppLogo size="md" variant="full" animated={false} />

          <div className="hidden sm:block h-8 w-px bg-[var(--color-line)]" />

          {/* Gamification Level & Streak Quick Badge */}
          <button
            type="button"
            onClick={() => setActiveTab("quests")}
            className="flex flex-col justify-center gap-1.5 min-w-[210px] text-left cursor-pointer group lg:w-[410px] lg:min-w-[410px]"
            title={t("tabs.quests")}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center whitespace-nowrap rounded-md bg-[var(--jade-soft)] px-2 py-0.5 font-bold text-[var(--jade-ink)] border border-[var(--jade)]/20 shadow-xs group-hover:underline">
                  {t("header.levelBadge", { level: gamification.level, rank: t(gamification.titleRankKey) })}
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[var(--amber-soft)] px-1.5 py-0.5 font-bold text-[var(--amber-ink)] border border-[var(--amber)]/20 shadow-xs">
                  <Flame size={12} weight="fill" className="text-[var(--amber)]" />
                  {t("header.streakBadge", { days: gamification.streakDays })}
                </span>
              </div>
              <span className="font-mono text-[var(--jade-ink)] font-semibold flex items-center gap-1">
                <span>XP:</span>
                <AnimatedCounter
                  value={gamification.currentLevelXp}
                  className="font-bold text-[var(--jade-ink)]"
                  duration={0.3}
                />
                <span className="text-[var(--color-ink-soft)]">/ {gamification.xpForNextLevel}</span>
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#4D8E75] to-[#1C5954] dark:from-[#8BB999] dark:to-[#76AA9D] shadow-xs"
                initial={shouldReduceMotion ? { width: `${levelProgressPct}%` } : { width: 0 }}
                animate={{ width: `${levelProgressPct}%` }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </button>
        </div>

        {/* Right: Month Selector, Theme Switcher, Quick Actions & Language */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-end 2xl:self-center 2xl:flex-nowrap">
          {/* Month Switcher */}
          <div className="flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-1 shadow-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] active:scale-[0.98] cursor-pointer"
              aria-label={t("header.previousMonth")}
            >
              <CaretLeft size={16} weight="bold" />
            </button>

            <span className="w-[124px] shrink-0 whitespace-nowrap text-center text-xs font-semibold text-[var(--color-ink)] px-2">
              {formattedMonth}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] active:scale-[0.98] cursor-pointer"
              aria-label={t("header.nextMonth")}
            >
              <CaretRight size={16} weight="bold" />
            </button>

            {activeMonth !== currentMonthISO && (
              <button
                type="button"
                onClick={() => setActiveMonth(currentMonthISO)}
                className="ml-1 rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--primary-ink)] border border-[var(--color-line)] hover:bg-[var(--primary-soft)] active:scale-[0.98] cursor-pointer"
              >
                {t("header.currentMonth")}
              </button>
            )}
          </div>

          {/* Theme Switcher Segmented Pill */}
          <div
            className="inline-flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-0.5 shadow-xs"
            role="radiogroup"
            aria-label={t("theme.title")}
          >
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setThemeMode(opt.mode)}
                  title={`${t("theme.title")}: ${opt.label}`}
                  aria-label={`${t("theme.title")}: ${opt.label}`}
                  aria-checked={isSelected}
                  role="radio"
                  className={`relative flex items-center justify-center rounded-lg p-1.5 text-xs transition-colors duration-200 cursor-pointer ${
                    isSelected
                      ? "text-[var(--color-ink)] font-bold"
                      : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="themePillIndicator"
                      className="absolute inset-0 rounded-lg bg-[var(--color-surface)] shadow-xs border border-[var(--color-line)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{opt.icon}</span>
                </button>
              );
            })}
          </div>

          {/* Language Switcher */}
          <div className="inline-flex rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-0.5 shadow-xs">
            {(["en", "th"] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => i18n.changeLanguage(lng)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition active:scale-[0.98] cursor-pointer ${
                  currentLang === lng
                    ? "bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] shadow-xs"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                {t(`lang.${lng}`)}
              </button>
            ))}
          </div>

          {/* Data Manager Trigger */}
          <TactileButton
            type="button"
            onClick={onOpenDataManager}
            title={t("header.dataManager")}
            aria-label={t("header.dataManager")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-surface)] shadow-xs"
          >
            <Database size={15} weight="duotone" />
            <span className="hidden 2xl:inline whitespace-nowrap">{t("header.dataManager")}</span>
          </TactileButton>

          {/* Scan Slip Button */}
          <TactileButton
            type="button"
            onClick={onOpenScanSlip}
            title={t("header.scanSlipTip")}
            aria-label={t("header.scanSlip")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--primary-ink)] transition hover:opacity-90 shadow-xs"
          >
            <Receipt size={15} weight="duotone" className="text-[var(--primary)]" />
            <span className="hidden 2xl:inline whitespace-nowrap">{t("header.scanSlip")}</span>
            <span className="hidden 2xl:inline-flex items-center whitespace-nowrap text-xs font-bold text-[var(--jade-ink)] opacity-90">
              +25 XP
            </span>
          </TactileButton>

          {/* Quick Add Button — Primary Deep Teal */}
          <TactileButton
            type="button"
            onClick={onOpenQuickAdd}
            title={t("header.quickAdd")}
            aria-label={t("header.quickAdd")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 shadow-sm"
          >
            <Plus size={15} weight="bold" />
            <span className="hidden 2xl:inline whitespace-nowrap">{t("header.quickAdd")}</span>
          </TactileButton>
        </div>
      </div>

      {/* Bottom Nav Tabs */}
      <nav className="mt-4 flex overflow-x-auto pb-1 gap-1.5 no-scrollbar" aria-label={t("tabs.navigation")}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative h-10 w-40 shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-center text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                isActive
                  ? "bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] shadow-sm"
                  : "bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] border border-[var(--color-line)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
