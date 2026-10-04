import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  FileCsv,
  FileCode,
  Warning,
  X,
  CheckCircle,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import {
  exportBackupJSON,
  exportToCSV,
  parseBackupJSON,
  parseCSV,
  type BackupData,
} from "../services/exportImport";
import type { Allocation, GamificationState, PresetItem, Quest, RecurringBill, SavingsGoal, TaxProfile, Transaction } from "../types";

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  allocations: Allocation[];
  quests: Quest[];
  income: number;
  gamification: GamificationState;
  taxProfile?: TaxProfile;
  presets?: PresetItem[];
  savingsGoals?: SavingsGoal[];
  recurringBills?: RecurringBill[];
  onRestoreBackup: (data: BackupData) => void;
  onImportTransactions: (imported: Transaction[]) => void;
  onResetData: () => void;
}

export const DataManagerModal: React.FC<DataManagerModalProps> = ({
  isOpen,
  onClose,
  transactions,
  allocations,
  quests,
  income,
  gamification,
  taxProfile,
  presets,
  savingsGoals,
  recurringBills,
  onRestoreBackup,
  onImportTransactions,
  onResetData,
}) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    try {
      exportToCSV(transactions);
      setFeedback({ type: "success", msg: "CSV exported successfully!" });
    } catch {
      setFeedback({ type: "error", msg: "Failed to export CSV." });
    }
  };

  const handleExportJSON = () => {
    try {
      exportBackupJSON({
        transactions,
        allocations,
        quests,
        income,
        gamification,
        taxProfile,
        presets,
        savingsGoals,
        recurringBills,
      });
      setFeedback({ type: "success", msg: "JSON backup exported successfully!" });
    } catch {
      setFeedback({ type: "error", msg: "Failed to export JSON backup." });
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setFeedback({ type: "error", msg: t("dataManager.importError") });
          return;
        }
        onImportTransactions(parsed);
        setFeedback({
          type: "success",
          msg: t("dataManager.importSuccess", { count: parsed.length }),
        });
      } catch {
        setFeedback({ type: "error", msg: t("dataManager.importError") });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleJSONUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = parseBackupJSON(text);
        onRestoreBackup(backupData);
        setFeedback({
          type: "success",
          msg: t("dataManager.importSuccess", { count: backupData.transactions.length }),
        });
      } catch {
        setFeedback({ type: "error", msg: t("dataManager.importError") });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetConfirm = () => {
    if (window.confirm(t("dataManager.resetConfirm"))) {
      onResetData();
      setFeedback({ type: "success", msg: "Data reset to initial state." });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl z-10"
          >
            {/* 1px Inner Liquid Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-[var(--color-ink)]">
                  {t("dataManager.title")}
                </h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                  {t("dataManager.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-line-subtle)] hover:text-[var(--color-ink)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {feedback && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                    feedback.type === "success"
                      ? "bg-[var(--jade-soft)] text-[var(--jade-ink)] border border-[var(--jade)]/30"
                      : "bg-[var(--rose-soft)] text-[var(--rose-ink)] border border-[var(--rose)]/30"
                  }`}
                >
                  <CheckCircle size={16} />
                  <span>{feedback.msg}</span>
                </div>
              )}

              {/* CSV Section */}
              <div className="rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-surface-subtle)]">
                <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-[var(--color-ink)]">
                  <FileCsv size={18} weight="duotone" className="text-[var(--primary)]" />
                  <span>{t("dataManager.csvSection")}</span>
                </div>
                <p className="text-xs text-[var(--color-ink-soft)] mb-3">
                  {t("dataManager.csvDesc")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition shadow-xs"
                  >
                    <ArrowDown size={14} /> {t("dataManager.exportCSV")}
                  </button>
                  <button
                    type="button"
                    onClick={() => csvInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition shadow-xs"
                  >
                    <ArrowUp size={14} /> {t("dataManager.importCSV")}
                  </button>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* JSON Section */}
              <div className="rounded-xl border border-[var(--color-line)] p-4 bg-[var(--color-surface-subtle)]">
                <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-[var(--color-ink)]">
                  <FileCode size={18} weight="duotone" className="text-[var(--moss)]" />
                  <span>{t("dataManager.jsonSection")}</span>
                </div>
                <p className="text-xs text-[var(--color-ink-soft)] mb-3">
                  {t("dataManager.jsonDesc")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition shadow-xs"
                  >
                    <ArrowDown size={14} /> {t("dataManager.exportJSON")}
                  </button>
                  <button
                    type="button"
                    onClick={() => jsonInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] transition shadow-xs"
                  >
                    <ArrowUp size={14} /> {t("dataManager.restoreJSON")}
                  </button>
                  <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleJSONUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)]/50 p-4">
                <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-[var(--rose-ink)]">
                  <Warning size={18} weight="fill" className="text-[var(--rose)]" />
                  <span>{t("dataManager.dangerZone")}</span>
                </div>
                <p className="text-xs text-[var(--rose-ink)]/80 mb-3">
                  {t("dataManager.resetConfirm")}
                </p>
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="rounded-lg bg-[var(--rose)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition shadow-xs"
                >
                  {t("dataManager.resetData")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
