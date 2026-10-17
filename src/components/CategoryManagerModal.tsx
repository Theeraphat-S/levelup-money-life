import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../constants/motion";
import { Eye, EyeSlash, PencilSimple, Plus, Trash, X } from "./icons";
import { useTranslation } from "react-i18next";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { useCategories } from "../hooks/useCategories";
import type { BudgetBucket } from "../types";
import {
  CATEGORY_ICON_KEYS,
  CATEGORY_PALETTE,
  LOCKED_CATEGORY_IDS,
  createCustomCategory,
  isCategoryNameTaken,
  type CategoryDef,
} from "../utils/categories";
import { CATEGORY_ICONS, CategoryIcon } from "./common/CategoryIcon";

const BUCKETS: BudgetBucket[] = ["Needs", "Wants", "Savings"];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (next: CategoryDef[]) => void;
  isUsed: (categoryId: string) => boolean;
}

type Draft = { id?: string; name: string; bucket: BudgetBucket; icon: string; color: string; limit: string };

const inputClass =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--primary)] shadow-xs";
const labelClass = "block text-xs font-semibold text-[var(--color-ink-soft)] mb-1";

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, onSave, isUsed }) => {
  const { t } = useTranslation();
  const categories = useCategories();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialogRef);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDraft(null);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const list = categories.list;
  const editingDef = draft?.id ? list.find((c) => c.id === draft.id) : undefined;
  const editingLocked = Boolean(editingDef && LOCKED_CATEGORY_IDS.has(editingDef.id));

  const startCreate = () => {
    const fresh = createCustomCategory("", "Wants", list);
    setError("");
    setDraft({ name: "", bucket: "Wants", icon: fresh.icon, color: fresh.color, limit: "" });
  };

  const startEdit = (c: CategoryDef) => {
    setError("");
    setDraft({
      id: c.id,
      name: c.builtIn ? categories.label(c.id) : c.name ?? "",
      bucket: c.bucket ?? "Wants",
      icon: c.icon,
      color: c.color,
      limit: c.monthlyLimit ? String(c.monthlyLimit) : "",
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const isBuiltIn = Boolean(editingDef?.builtIn);
    if (!isBuiltIn) {
      if (!draft.name.trim()) {
        setError(t("categories.nameRequired"));
        return;
      }
      if (isCategoryNameTaken(draft.name, list, categories.label, draft.id)) {
        setError(t("categories.nameTaken"));
        return;
      }
    }
    let limit: number | undefined;
    if (draft.limit.trim()) {
      limit = Number(draft.limit);
      if (!Number.isFinite(limit) || limit <= 0) {
        setError(t("categories.limitInvalid"));
        return;
      }
    }
    const base: CategoryDef = editingDef ?? { ...createCustomCategory(draft.name, draft.bucket, list) };
    const { monthlyLimit: _previous, ...rest } = base;
    const next: CategoryDef = {
      ...rest,
      ...(isBuiltIn ? {} : { name: draft.name.trim() }),
      icon: draft.icon,
      color: draft.color,
      bucket: editingLocked ? base.bucket : draft.bucket,
      ...(limit && !editingLocked ? { monthlyLimit: limit } : {}),
    };
    onSave(editingDef ? list.map((c) => (c.id === next.id ? next : c)) : [...list, next]);
    setDraft(null);
  };

  const toggleHidden = (c: CategoryDef) => {
    onSave(list.map((item) => (item.id === c.id ? { ...item, hidden: !item.hidden } : item)));
  };

  const remove = (c: CategoryDef) => {
    if (isUsed(c.id)) {
      setError(t("categories.usedHint"));
      return;
    }
    onSave(list.filter((item) => item.id !== c.id));
    if (draft?.id === c.id) setDraft(null);
  };

  const bucketLabel = (bucket: BudgetBucket | null) => (bucket ? t(`alloc.${bucket}`) : t("category.Income"));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={SPRING.overlay}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-4">
              <div>
                <h2 id="category-modal-title" className="text-base font-bold tracking-tight text-[var(--color-ink)]">{t("categories.title")}</h2>
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{t("categories.subtitle")}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t("ux.close")} className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-line-subtle)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">{t("categories.title")} ({list.length})</span>
                <button type="button" onClick={startCreate} className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 py-1 text-xs font-semibold text-[var(--primary-contrast)] shadow-xs transition hover:opacity-90">
                  <Plus size={14} weight="bold" />
                  {t("categories.add")}
                </button>
              </div>

              {error && !draft && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{error}</p>}

              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((c) => {
                  const locked = LOCKED_CATEGORY_IDS.has(c.id);
                  const used = isUsed(c.id);
                  return (
                    <li
                      key={c.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 ${draft?.id === c.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--color-line)] bg-[var(--color-surface-subtle)]"} ${c.hidden ? "opacity-60" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
                          <CategoryIcon category={c.id} size={17} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-[var(--color-ink)]">{categories.label(c.id)}</div>
                          <div className="truncate text-xs text-[var(--color-ink-soft)]">
                            {bucketLabel(c.bucket)}
                            {c.hidden && ` · ${t("categories.hiddenBadge")}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" onClick={() => startEdit(c)} aria-label={`${t("categories.edit")}: ${categories.label(c.id)}`} className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]">
                          <PencilSimple size={14} />
                        </button>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => toggleHidden(c)}
                            aria-label={`${c.hidden ? t("categories.show") : t("categories.hide")}: ${categories.label(c.id)}`}
                            title={c.hidden ? t("categories.show") : t("categories.hide")}
                            className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                          >
                            {c.hidden ? <Eye size={14} /> : <EyeSlash size={14} />}
                          </button>
                        )}
                        {!c.builtIn && (
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            aria-label={`${t("categories.delete")}: ${categories.label(c.id)}`}
                            title={used ? t("categories.usedHint") : t("categories.delete")}
                            disabled={used}
                            className="rounded-lg p-1.5 text-[var(--rose-ink)] transition hover:bg-[var(--rose-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-[var(--color-ink-soft)]">{t("categories.lockedHint")}</p>

              {draft && (
                <form onSubmit={save} className="space-y-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/20 p-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-ink)]">{draft.id ? t("categories.edit") : t("categories.add")}</h3>
                    <button type="button" onClick={() => setDraft(null)} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">{t("accounts.cancel")}</button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="category-name" className={labelClass}>{t("categories.name")}</label>
                      <input
                        id="category-name"
                        type="text"
                        autoFocus
                        maxLength={40}
                        value={draft.name}
                        disabled={Boolean(editingDef?.builtIn)}
                        placeholder={t("categories.namePlaceholder")}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className={`${inputClass} disabled:opacity-60`}
                      />
                    </div>
                    <div>
                      <label htmlFor="category-bucket" className={labelClass}>{t("categories.bucket")}</label>
                      <select
                        id="category-bucket"
                        value={draft.bucket}
                        disabled={editingLocked}
                        onChange={(e) => setDraft({ ...draft, bucket: e.target.value as BudgetBucket })}
                        className={`${inputClass} disabled:opacity-60`}
                      >
                        {BUCKETS.map((b) => <option key={b} value={b}>{t(`alloc.${b}`)}</option>)}
                      </select>
                    </div>
                  </div>

                  <fieldset>
                    <legend className={labelClass}>{t("categories.icon")}</legend>
                    <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5">
                      {CATEGORY_ICON_KEYS.map((key) => {
                        const Icon = CATEGORY_ICONS[key];
                        const selected = draft.icon === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={selected}
                            aria-label={key}
                            onClick={() => setDraft({ ...draft, icon: key })}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${selected ? "bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]" : "hover:bg-[var(--color-surface-subtle)]"}`}
                          >
                            <Icon size={17} weight="duotone" color={draft.color} />
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className={labelClass}>{t("categories.color")}</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_PALETTE.map((color) => {
                        const selected = draft.color.toLowerCase() === color.toLowerCase();
                        return (
                          <button
                            key={color}
                            type="button"
                            aria-pressed={selected}
                            aria-label={color}
                            onClick={() => setDraft({ ...draft, color })}
                            className={`h-7 w-7 rounded-full border-2 transition ${selected ? "border-[var(--color-ink)] scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: color }}
                          />
                        );
                      })}
                    </div>
                  </fieldset>

                  {!editingLocked && (
                    <div className="sm:max-w-[50%]">
                      <label htmlFor="category-limit" className={labelClass}>{t("categories.monthlyLimit")}</label>
                      <input
                        id="category-limit"
                        type="number"
                        min="0"
                        step="100"
                        value={draft.limit}
                        placeholder={t("categories.noLimit")}
                        onChange={(e) => setDraft({ ...draft, limit: e.target.value })}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  )}

                  {error && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{error}</p>}

                  <div className="flex justify-end">
                    <button type="submit" className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-contrast)] shadow-xs transition hover:opacity-90">
                      {t("categories.save")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
