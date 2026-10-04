import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUUpLeft, CheckCircle, Sparkle, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { Transaction } from "../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface UndoToastProps {
  transaction: Transaction | null;
  xpAwarded?: number;
  onUndo: (tx: Transaction) => void;
  onDismiss: () => void;
  onView?: (tx: Transaction) => void;
  durationMs?: number; // default 5000ms
}

export const UndoToast: React.FC<UndoToastProps> = ({
  transaction,
  xpAwarded = 15,
  onUndo,
  onDismiss,
  onView,
  durationMs = 5000,
}) => {
  const { t } = useTranslation();
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;

  useEffect(() => {
    if (!transaction) return;

    setTimeLeftMs(durationMs);
    const interval = 100;
    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= interval) {
          clearInterval(timer);
          onDismissRef.current();
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [transaction?.id, durationMs]);

  const secondsRemaining = Math.max(1, Math.ceil(timeLeftMs / 1000));
  const progressPct = Math.max(0, Math.min(100, (timeLeftMs / durationMs) * 100));

  return (
    <AnimatePresence>
      {transaction && (
        <motion.aside
          key={transaction.id}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-[var(--color-surface)] shadow-2xl backdrop-blur-md max-w-md w-full sm:w-auto"
        >
          {/* Top 1px highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

          {/* Dynamic Countdown Progress Bar at Bottom Edge */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--color-line)] overflow-hidden">
            <motion.div
              className="h-full bg-[var(--primary)]"
              style={{ width: `${progressPct}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 sm:px-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Status Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--jade-soft)] text-[var(--jade)] border border-[var(--jade)]/30 shadow-xs">
                <CheckCircle size={18} weight="fill" />
              </div>

              {/* Description & Amount */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink)] truncate">
                  <span className="truncate">{transaction.name}</span>
                  <span
                    className={`font-mono font-bold ${
                      transaction.amount >= 0 ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"
                    }`}
                  >
                    {transaction.amount >= 0 ? "+" : "-"}฿{thb.format(Math.abs(transaction.amount))}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
                  <span>{t(`category.${transaction.category}`)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 font-bold text-[var(--jade-ink)]">
                    <Sparkle size={11} weight="fill" />
                    +{xpAwarded} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-1">
              {onView && <button type="button" onClick={() => onView(transaction)} className="rounded-lg px-2 py-2 text-xs font-semibold underline text-[var(--primary-ink)] transition active:scale-[0.98] cursor-pointer">{t("ux.viewTransaction")}</button>}
              <button
                type="button"
                onClick={() => onUndo(transaction)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--amber)]/40 bg-[var(--amber-soft)] hover:opacity-90 px-3 py-1.5 text-xs font-bold text-[var(--amber-ink)] shadow-xs transition active:scale-95 cursor-pointer"
              >
                <ArrowUUpLeft size={14} weight="bold" />
                <span>{t("quickBar.undo", { seconds: secondsRemaining })}</span>
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] transition"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
