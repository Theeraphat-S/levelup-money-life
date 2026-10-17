import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../constants/motion";
import {
  ArrowCounterClockwise,
  Check,
  PencilSimple,
  Plus,
  Trash,
  X,
} from "./icons";
import { useTranslation } from "react-i18next";
import {
  type Account,
  type PresetItem,
  type TransactionCategory,
} from "../types";
import {
  DEFAULT_PRESETS,
  addPreset,
  updatePreset,
  deletePreset,
} from "../utils/presetManager";
import { CustomSelect } from "./common/CustomSelect";
import { CategoryPicker } from "./common/CategoryPicker";
import { CategoryIcon } from "./common/CategoryIcon";
import { PresetIcon } from "./common/PresetIcon";
import { AppIcon, PICKER_ICON_KEYS } from "./icons/registry";
import { useCategories } from "../hooks/useCategories";


interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PresetItem[];
  setPresets: (presets: PresetItem[]) => void;
  accounts?: Account[];
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  presets,
  setPresets,
  accounts = [],
}) => {
  const { t } = useTranslation();
  const { label: categoryLabel } = useCategories();

  const [editingPreset, setEditingPreset] = useState<PresetItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [icon, setIcon] = useState("meal");
  const [category, setCategory] = useState<TransactionCategory>("Food");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [accountId, setAccountId] = useState("");
  const [formError, setFormError] = useState("");
  const activeAccounts = accounts.filter((a) => !a.archived);

  const handleStartCreate = () => {
    setEditingPreset(null);
    setIsCreatingNew(true);
    setName("");
    setAmount("");
    setIcon("meal");
    setCategory("Food");
    setType("expense");
    setAccountId("");
    setFormError("");
  };

  const handleStartEdit = (p: PresetItem) => {
    setIsCreatingNew(false);
    setEditingPreset(p);
    setName(p.name);
    setAmount(String(p.amount));
    setIcon(p.icon);
    setCategory(p.category);
    setType(p.type || (p.category === "Income" ? "income" : "expense"));
    setAccountId(p.accountId ?? "");
    setFormError("");
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      setFormError(t("ux.descriptionRequired"));
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError(t("ux.amountRequired"));
      return;
    }

    if (isCreatingNew) {
      const updated = addPreset(
        {
          name: name.trim(),
          amount: numAmount,
          icon: icon || "note",
          category: type === "income" ? "Income" : category,
          type,
          ...(accountId ? { accountId } : {}),
        },
        presets
      );
      setPresets(updated);
    } else if (editingPreset) {
      const { accountId: _previousAccount, ...editingBase } = editingPreset;
      const updatedItem: PresetItem = {
        ...editingBase,
        ...(accountId ? { accountId } : {}),
        name: name.trim(),
        amount: numAmount,
        icon: icon || "note",
        category: type === "income" ? "Income" : category,
        type,
      };
      const updated = updatePreset(updatedItem, presets);
      setPresets(updated);
    }

    setIsCreatingNew(false);
    setEditingPreset(null);
  };

  const handleDelete = (id: string) => {
    const updated = deletePreset(id, presets);
    setPresets(updated);
    if (editingPreset?.id === id) {
      setEditingPreset(null);
      setIsCreatingNew(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm(t("presetModal.resetConfirm"))) {
      setPresets(DEFAULT_PRESETS);
      setEditingPreset(null);
      setIsCreatingNew(false);
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="preset-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={SPRING.overlay}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-4">
              <div>
                <h2 id="preset-modal-title" className="text-base font-bold tracking-tight text-[var(--color-ink)]">
                  {t("presetModal.title")}
                </h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                  {t("presetModal.subtitle")}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Presets List Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider">
                    {t("quickBar.presets")} ({presets.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
                    >
                      <ArrowCounterClockwise size={13} />
                      <span>{t("presetModal.resetDefaults")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast)] px-2.5 py-1 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                    >
                      <Plus size={14} weight="bold" />
                      <span>{t("presetModal.addTitle")}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presets.map((preset) => {
                    const isCurrentEditing = editingPreset?.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`flex items-center justify-between rounded-xl border p-3 transition ${
                          isCurrentEditing
                            ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                            : "border-[var(--color-line)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PresetIcon icon={preset.icon} category={preset.category} className="h-9 w-9" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--color-ink)] truncate">
                              {preset.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-mono font-bold text-[var(--color-ink)]">
                                ฿{preset.amount}
                              </span>
                              <span className="text-[var(--color-ink-soft)]">·</span>
                              <span
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.2 text-xs font-medium border border-[var(--color-line)] bg-[var(--color-surface)]"
                              >
                                <CategoryIcon category={preset.category} size={12} />
                                {categoryLabel(preset.category)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(preset)}
                            title={t("presetModal.editTitle")}
                            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition"
                          >
                            <PencilSimple size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(preset.id)}
                            title={t("presetModal.delete")}
                            className="rounded-lg p-1.5 text-[var(--rose-ink)] hover:bg-[var(--rose-soft)] transition"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Section (Add or Edit) */}
              {(isCreatingNew || editingPreset) && (
                <form
                  onSubmit={handleSaveForm}
                  className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/20 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-ink)]">
                      {isCreatingNew ? t("presetModal.addTitle") : t("presetModal.editTitle")}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingPreset(null);
                      }}
                      className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    >
                      {t("presetModal.cancel")}
                    </button>
                  </div>

                  {/* Icon Selector Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
                      {t("presetModal.iconLabel")}
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)]">
                      {PICKER_ICON_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setIcon(key)}
                          aria-label={key}
                          aria-pressed={icon === key}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            icon === key
                              ? "bg-[var(--primary)] text-[var(--primary-contrast)] shadow-xs scale-110"
                              : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                          }`}
                        >
                          <AppIcon name={key} size={18} weight={icon === key ? "fill" : "duotone"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Amount Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                        {t("presetModal.nameLabel")}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t("presetModal.namePlaceholder")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                        {t("presetModal.amountLabel")}
                      </label>
                      <div className="flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
                        <span className="font-mono text-xs font-bold text-[var(--color-ink-soft)] mr-1.5">
                          ฿
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          required
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-transparent font-mono text-xs font-bold text-[var(--color-ink)] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Type Selector (Expense / Income) */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
                      {t("presetModal.typeLabel")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setType("expense");
                          if (category === "Income") setCategory("Food");
                        }}
                        className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition shadow-xs ${
                          type === "expense"
                            ? "bg-[var(--primary)] text-[var(--primary-contrast)] shadow-xs"
                            : "bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                        }`}
                      >
                        {t("presetModal.typeExpense")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setType("income");
                          setCategory("Income");
                        }}
                        className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition shadow-xs ${
                          type === "income"
                            ? "bg-[var(--jade)] text-white shadow-xs"
                            : "bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                        }`}
                      >
                        {t("presetModal.typeIncome")}
                      </button>
                    </div>
                  </div>

                  {/* Account (only when there is a choice to make) */}
                  {activeAccounts.length > 1 && (
                    <div>
                      <span className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                        {t("accounts.presetAccount")}
                      </span>
                      <CustomSelect
                        value={accountId}
                        onChange={setAccountId}
                        ariaLabel={t("accounts.presetAccount")}
                        className="w-full"
                        options={[
                          { value: "", label: t("accounts.useDefault"), textValue: t("accounts.useDefault") },
                          ...activeAccounts.map((a) => ({ value: a.id, label: a.name, textValue: a.name, badge: t(`accounts.types.${a.type}`) })),
                        ]}
                      />
                    </div>
                  )}

                  {/* Category Selector (Only for Expense) */}
                  {type === "expense" && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
                        {t("presetModal.categoryLabel")}
                      </label>
                      <CategoryPicker value={category} onChange={setCategory} />
                    </div>
                  )}

                  {formError && (
                    <div className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose-soft)] px-3 py-2 text-xs font-medium text-[var(--rose-ink)]">
                      {formError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-line)]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingPreset(null);
                      }}
                      className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] transition"
                    >
                      {t("presetModal.cancel")}
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-contrast)] px-4 py-1.5 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                    >
                      <Check size={14} weight="bold" />
                      <span>{t("presetModal.save")}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-[var(--color-ink-soft)] font-mono">
                {t("quickBar.shortcutHint")}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] shadow-xs transition"
              >
                {t("presetModal.cancel")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
