import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  CaretDown,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export interface CustomDatePickerProps {
  value: string; // ISO format "YYYY-MM-DD"
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  align?: "left" | "right";
  allowClear?: boolean;
  minDate?: string;
  maxDate?: string;
  ariaLabel?: string;
}

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const MONTH_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_SHORT_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const WEEKDAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAYS_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function parseISODate(isoStr?: string): { year: number; month: number; day: number } | null {
  if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return null;
  const parts = isoStr.split("-").map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null;
  return { year: parts[0], month: parts[1] - 1, day: parts[2] };
}

function formatISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  size = "md",
  className = "",
  align = "left",
  allowClear = false,
  minDate,
  maxDate,
  ariaLabel,
}) => {
  const { t, i18n } = useTranslation();
  const isThai = i18n.language === "th";
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const containerRef = useRef<HTMLDivElement>(null);
  const datepickerId = useId();

  // Today's local components
  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      iso: formatISODate(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }, []);

  const parsedValue = useMemo(() => parseISODate(value), [value]);

  // Current viewing month & year
  const [viewYear, setViewYear] = useState<number>(() => parsedValue?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState<number>(() => parsedValue?.month ?? today.month);

  // Sync view when opened or value changed
  useEffect(() => {
    if (isOpen) {
      if (parsedValue) {
        setViewYear(parsedValue.year);
        setViewMonth(parsedValue.month);
      } else {
        setViewYear(today.year);
        setViewMonth(today.month);
      }
      setViewMode("days");
    }
  }, [isOpen, parsedValue, today]);

  // Click outside & Escape key listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDownGlobal = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [isOpen]);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar Day Grid Computation
  const calendarDays = useMemo(() => {
    const days: Array<{
      date: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      iso: string;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month overflow days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = daysInPrevMonth - i;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const iso = formatISODate(prevY, prevM, prevDate);
      days.push({
        date: prevDate,
        month: prevM,
        year: prevY,
        isCurrentMonth: false,
        iso,
        isToday: iso === today.iso,
        isSelected: iso === value,
        isDisabled: (minDate && iso < minDate) || (maxDate && iso > maxDate) || false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const iso = formatISODate(viewYear, viewMonth, i);
      days.push({
        date: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        iso,
        isToday: iso === today.iso,
        isSelected: iso === value,
        isDisabled: (minDate && iso < minDate) || (maxDate && iso > maxDate) || false,
      });
    }

    // Next month overflow days (fill grid to 35 or 42 cells)
    const remainingSlots = (7 - (days.length % 7)) % 7;
    const targetTotal = days.length + remainingSlots < 35 ? 35 : days.length + remainingSlots;
    const additionalNeeded = targetTotal - days.length;

    for (let i = 1; i <= additionalNeeded; i++) {
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const iso = formatISODate(nextY, nextM, i);
      days.push({
        date: i,
        month: nextM,
        year: nextY,
        isCurrentMonth: false,
        iso,
        isToday: iso === today.iso,
        isSelected: iso === value,
        isDisabled: (minDate && iso < minDate) || (maxDate && iso > maxDate) || false,
      });
    }

    return days;
  }, [viewYear, viewMonth, value, today, minDate, maxDate]);

  // Display label formatting
  const displayLabel = useMemo(() => {
    if (!parsedValue) return placeholder || t("calendar.selectDate");
    const mShort = isThai ? MONTH_SHORT_TH[parsedValue.month] : MONTH_SHORT_EN[parsedValue.month];
    return `${parsedValue.day} ${mShort} ${parsedValue.year}`;
  }, [parsedValue, placeholder, isThai, t]);

  const monthNames = isThai ? MONTH_NAMES_TH : MONTH_NAMES_EN;
  const monthShort = isThai ? MONTH_SHORT_TH : MONTH_SHORT_EN;
  const weekdays = isThai ? WEEKDAYS_TH : WEEKDAYS_EN;

  const isSmall = size === "sm";

  // Years for year picker
  const startYear = Math.floor(viewYear / 12) * 12;
  const yearsList = Array.from({ length: 12 }, (_, i) => startYear + i);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={datepickerId}
        aria-label={ariaLabel || displayLabel}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`group relative flex w-full items-center justify-between gap-2 rounded-xl border font-mono font-medium transition-all duration-200 outline-none select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall
            ? "px-2.5 py-1 text-xs"
            : "px-3 py-2 text-xs sm:text-sm"
        } ${
          isOpen
            ? "border-[var(--primary)] bg-[var(--color-surface)] shadow-[0_0_0_2px_rgba(77,142,117,0.15)]"
            : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--primary)]/70 hover:bg-[var(--color-surface-hover)] shadow-xs"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarBlank
            size={isSmall ? 14 : 16}
            weight="duotone"
            className="shrink-0 text-[var(--primary)] group-hover:scale-105 transition-transform"
          />
          <span
            className={`truncate ${
              parsedValue
                ? "text-[var(--color-ink)] font-semibold"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            {displayLabel}
          </span>
        </div>

        <CaretDown
          size={isSmall ? 12 : 14}
          weight="bold"
          className={`shrink-0 text-[var(--color-ink-soft)] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--primary)]" : "group-hover:text-[var(--color-ink)]"
          }`}
        />
      </button>

      {/* Floating Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={datepickerId}
            role="dialog"
            aria-label={ariaLabel || t("calendar.selectDate")}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`absolute z-50 w-72 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/95 p-3.5 backdrop-blur-xl shadow-2xl outline-none ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {/* Header: Month & Year & Switchers */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <button
                type="button"
                onClick={
                  viewMode === "years"
                    ? () => setViewYear((y) => y - 12)
                    : prevMonth
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] active:scale-95"
                aria-label={t("calendar.prevMonth")}
              >
                <CaretLeft size={16} weight="bold" />
              </button>

              {/* Month/Year Title Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "months" ? "days" : "months")}
                  className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                    viewMode === "months"
                      ? "bg-[var(--primary-soft)] text-[var(--primary-ink)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  {monthNames[viewMonth]}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "years" ? "days" : "years")}
                  className={`rounded-lg px-2 py-1 font-mono text-xs font-bold transition ${
                    viewMode === "years"
                      ? "bg-[var(--primary-soft)] text-[var(--primary-ink)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  {viewYear}
                </button>
              </div>

              <button
                type="button"
                onClick={
                  viewMode === "years"
                    ? () => setViewYear((y) => y + 12)
                    : nextMonth
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] active:scale-95"
                aria-label={t("calendar.nextMonth")}
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            {/* View Mode 1: Month Selector Grid */}
            {viewMode === "months" && (
              <div className="grid grid-cols-3 gap-1.5 py-2">
                {monthShort.map((m, idx) => {
                  const isCurrent = idx === viewMonth;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setViewMode("days");
                      }}
                      className={`rounded-xl py-2 text-xs font-medium transition active:scale-95 ${
                        isCurrent
                          ? "bg-[var(--primary)] text-white font-bold shadow-xs"
                          : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View Mode 2: Year Selector Grid */}
            {viewMode === "years" && (
              <div className="grid grid-cols-3 gap-1.5 py-2">
                {yearsList.map((yr) => {
                  const isCurrent = yr === viewYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewYear(yr);
                        setViewMode("months");
                      }}
                      className={`rounded-xl py-2 font-mono text-xs font-medium transition active:scale-95 ${
                        isCurrent
                          ? "bg-[var(--primary)] text-white font-bold shadow-xs"
                          : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View Mode 3: Days Calendar View */}
            {viewMode === "days" && (
              <>
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {weekdays.map((w, i) => (
                    <span
                      key={w}
                      className={`text-xs font-semibold ${
                        i === 0 || i === 6
                          ? "text-[var(--rose-ink)]/70 dark:text-[var(--rose-ink)]/80"
                          : "text-[var(--color-ink-soft)]"
                      }`}
                    >
                      {w}
                    </span>
                  ))}
                </div>

                {/* Day Buttons Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((cell, idx) => {
                    return (
                      <button
                        key={`${cell.iso}-${idx}`}
                        type="button"
                        disabled={cell.isDisabled}
                        onClick={() => {
                          onChange(cell.iso);
                          setIsOpen(false);
                        }}
                        className={`relative flex h-8 w-8 mx-auto items-center justify-center rounded-xl font-mono text-xs transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                          cell.isSelected
                            ? "bg-[var(--primary)] text-white font-bold shadow-md shadow-[var(--primary)]/30 scale-105 z-10 ring-2 ring-[var(--primary)]/40"
                            : cell.isToday
                            ? "border border-[var(--primary)] text-[var(--primary-ink)] font-bold bg-[var(--primary-soft)]/40 hover:bg-[var(--primary-soft)]"
                            : cell.isCurrentMonth
                            ? "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] font-medium"
                            : "text-[var(--color-ink-soft)]/40 hover:bg-[var(--color-surface-subtle)]/60 font-normal"
                        }`}
                      >
                        <span>{cell.date}</span>

                        {cell.isToday && !cell.isSelected && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--primary)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Quick Actions Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange(today.iso);
                  setViewYear(today.year);
                  setViewMonth(today.month);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-[var(--primary-ink)] transition hover:bg-[var(--primary-soft)] active:scale-95"
              >
                <Sparkle size={13} weight="fill" className="text-[var(--primary)]" />
                <span>{t("calendar.today")}</span>
              </button>

              <div className="flex items-center gap-1">
                {allowClear && value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--rose-ink)] transition hover:bg-[var(--rose-soft)] active:scale-95"
                  >
                    <X size={12} weight="bold" />
                    <span>{t("calendar.clear")}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-2.5 py-1 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] active:scale-95"
                >
                  {t("calendar.close")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
