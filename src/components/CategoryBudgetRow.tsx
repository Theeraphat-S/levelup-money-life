import React, { useState } from "react";
import { Check, PencilSimple, WarningCircle, X } from "./icons";
import { useTranslation } from "react-i18next";
import { useCategories } from "../hooks/useCategories";
import { LOCKED_CATEGORY_IDS, budgetLevel } from "../utils/categories";
import { CategoryIcon } from "./common/CategoryIcon";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface CategoryBudgetRowProps {
  categoryId: string;
  spent: number;
  onSetLimit?: (categoryId: string, limit: number | undefined) => void;
}

/** One category inside a 50/30/20 bucket: spending, its optional monthly cap and a status label. */
export const CategoryBudgetRow: React.FC<CategoryBudgetRowProps> = ({ categoryId, spent, onSetLimit }) => {
  const { t } = useTranslation();
  const { get, label } = useCategories();
  const category = get(categoryId);
  const limit = category.monthlyLimit;
  const canLimit = Boolean(onSetLimit) && !LOCKED_CATEGORY_IDS.has(categoryId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const ratio = limit ? spent / limit : 0;
  const level = limit ? budgetLevel(ratio) : "ok";
  const barColor = level === "over" ? "bg-[var(--rose)]" : level === "warn" ? "bg-[var(--amber)]" : "bg-[var(--jade)]";

  const startEdit = () => {
    setDraft(limit ? String(limit) : "");
    setError("");
    setEditing(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) {
      onSetLimit?.(categoryId, undefined);
      setEditing(false);
      return;
    }
    const value = Number(draft);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("categories.limitInvalid"));
      return;
    }
    onSetLimit?.(categoryId, value);
    setEditing(false);
  };

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <CategoryIcon category={categoryId} />
          <span className="truncate">{label(categoryId)}</span>
        </span>
        {editing ? (
          <form onSubmit={save} className="flex items-center gap-1">
            <span className="font-mono text-[var(--color-ink-soft)]">฿</span>
            <input
              type="number"
              min="0"
              step="100"
              autoFocus
              value={draft}
              placeholder={t("categories.noLimit")}
              aria-label={t("categories.limitFor", { name: label(categoryId) })}
              onChange={(event) => setDraft(event.target.value)}
              className="w-20 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-ink)] outline-none focus:border-[var(--primary)]"
            />
            <button type="submit" aria-label={t("categories.saveLimit")} className="rounded-md p-1 text-[var(--jade-ink)] hover:bg-[var(--jade-soft)]"><Check size={13} weight="bold" /></button>
            <button type="button" aria-label={t("ux.close")} onClick={() => setEditing(false)} className="rounded-md p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"><X size={13} /></button>
          </form>
        ) : (
          <span className="flex shrink-0 items-center gap-1">
            <span className="font-mono text-[var(--color-ink-soft)]">
              ฿{thb.format(spent)}{limit ? <span> / ฿{thb.format(limit)}</span> : null}
            </span>
            {canLimit && (
              <button
                type="button"
                onClick={startEdit}
                aria-label={t("categories.limitFor", { name: label(categoryId) })}
                title={limit ? t("categories.editLimit") : t("categories.setLimit")}
                className="rounded-md p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]"
              >
                <PencilSimple size={12} />
              </button>
            )}
          </span>
        )}
      </div>
      {error && <p role="alert" className="mt-1 text-[var(--rose-ink)]">{error}</p>}
      {limit && !editing ? (
        <div className="mt-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} />
          </div>
          {level !== "ok" && (
            <p className={`mt-1 flex items-center gap-1 font-semibold ${level === "over" ? "text-[var(--rose-ink)]" : "text-[var(--amber-ink)]"}`}>
              <WarningCircle size={12} weight="fill" aria-hidden />
              {level === "over"
                ? t("categories.overLimit", { amount: thb.format(spent - limit) })
                : t("categories.nearLimit", { percent: Math.round(ratio * 100) })}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};
