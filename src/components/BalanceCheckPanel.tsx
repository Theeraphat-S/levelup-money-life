import React, { useState } from "react";
import { CheckCircle, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useCategories } from "../hooks/useCategories";
import type { Account, Transaction } from "../types";
import { balanceDifference, buildBalanceAdjustment, type SplitLine } from "../utils/balanceCheck";
import { getLocalTodayISO } from "../utils/safeToSpend";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const inputClass =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--primary)] shadow-xs";

type SplitDraft = { name: string; amount: string; category: string };

interface BalanceCheckPanelProps {
  account: Account;
  recordedBalance: number;
  onApply: (account: Account, transactions: Transaction[]) => void;
  onCancel: () => void;
}

/** Compare an account with its real balance and record the difference so the two match again. */
export const BalanceCheckPanel: React.FC<BalanceCheckPanelProps> = ({ account, recordedBalance, onApply, onCancel }) => {
  const { t } = useTranslation();
  const categories = useCategories();
  const isCredit = account.type === "credit";
  const [actualStr, setActualStr] = useState("");
  const [splits, setSplits] = useState<SplitDraft[]>([]);
  const [error, setError] = useState("");

  // Cards are entered as an amount owed, matching how the account list shows them
  const shown = (balance: number) => (isCredit ? -balance : balance);
  const actualInput = actualStr.trim() === "" ? NaN : Number(actualStr);
  const actualBalance = isCredit ? -actualInput : actualInput;
  const hasActual = Number.isFinite(actualInput);
  const difference = hasActual ? balanceDifference(recordedBalance, actualBalance) : 0;
  const parsedSplits: SplitLine[] = splits.map((s) => ({ name: s.name, amount: Number(s.amount), category: s.category }));
  const explained = parsedSplits.reduce((sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0), 0);
  const remainder = Math.max(0, Math.round((-difference - explained) * 100) / 100);

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const result = buildBalanceAdjustment({
      account,
      recordedBalance,
      actualBalance,
      date: getLocalTodayISO(),
      splits: difference < 0 ? parsedSplits : [],
      labels: { unaccounted: t("accounts.unaccountedName"), adjustment: t("accounts.adjustmentName") },
    });
    if (!result.ok) {
      setError(t(`accounts.errors.${result.error}`));
      return;
    }
    onApply(account, result.transactions);
  };

  return (
    <form onSubmit={apply} className="space-y-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/20 p-4" aria-label={t("accounts.checkTitle", { name: account.name })}>
      <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-ink)]">{t("accounts.checkTitle", { name: account.name })}</h3>
        <button type="button" onClick={onCancel} className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">{t("accounts.cancel")}</button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">{isCredit ? t("accounts.recordedOwed") : t("accounts.recordedBalance")}</span>
          <div className="px-1 py-2 font-mono text-sm font-bold text-[var(--color-ink)]">฿{thb.format(shown(recordedBalance))}</div>
        </div>
        <div>
          <label htmlFor="balance-actual" className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">{isCredit ? t("accounts.actualOwed") : t("accounts.actualBalance")}</label>
          <input
            id="balance-actual"
            type="number"
            step="any"
            inputMode="decimal"
            autoFocus
            value={actualStr}
            onChange={(e) => { setActualStr(e.target.value); setError(""); }}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {hasActual && (
        <p
          role="status"
          className={`flex items-center gap-1.5 text-sm font-semibold ${difference === 0 ? "text-[var(--jade-ink)]" : difference < 0 ? "text-[var(--rose-ink)]" : "text-[var(--amber-ink)]"}`}
        >
          {difference === 0 ? <CheckCircle size={16} weight="fill" aria-hidden /> : <WarningCircle size={16} weight="fill" aria-hidden />}
          {difference === 0
            ? t("accounts.matches")
            : difference < 0
              ? t("accounts.missing", { amount: thb.format(-difference) })
              : t("accounts.surplus", { amount: thb.format(difference) })}
        </p>
      )}

      {hasActual && difference < 0 && (
        <div className="space-y-2">
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-ink)]">{t("accounts.splitTitle")}</h4>
            <p className="text-xs text-[var(--color-ink-soft)]">{t("accounts.splitHint")}</p>
          </div>
          {splits.map((split, index) => (
            <div key={index} className="grid grid-cols-[1fr_6rem_auto] gap-2 sm:grid-cols-[1fr_7rem_10rem_auto]">
              <input
                type="text"
                aria-label={t("accounts.splitName")}
                placeholder={t("accounts.splitName")}
                value={split.name}
                onChange={(e) => setSplits(splits.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)))}
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                step="any"
                aria-label={t("accounts.amount")}
                placeholder="0"
                value={split.amount}
                onChange={(e) => setSplits(splits.map((s, i) => (i === index ? { ...s, amount: e.target.value } : s)))}
                className={`${inputClass} font-mono`}
              />
              <select
                aria-label={t("quickAdd.categoryLabel")}
                value={split.category}
                onChange={(e) => setSplits(splits.map((s, i) => (i === index ? { ...s, category: e.target.value } : s)))}
                className={`${inputClass} col-span-2 sm:col-span-1`}
              >
                {categories.expenseIds({ excludeSavings: true, keep: split.category }).map((id) => (
                  <option key={id} value={id}>{categories.label(id)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSplits(splits.filter((_, i) => i !== index))}
                aria-label={t("accounts.removeSplit")}
                className="row-start-1 col-start-3 self-center rounded-lg p-1.5 text-[var(--rose-ink)] hover:bg-[var(--rose-soft)] sm:col-start-4"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSplits([...splits, { name: "", amount: "", category: "Food" }])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-ink)] hover:underline"
          >
            <Plus size={13} weight="bold" />
            {t("accounts.addSplit")}
          </button>
          <p className="text-xs text-[var(--color-ink-soft)]">{t("accounts.remainderUnaccounted", { amount: thb.format(remainder) })}</p>
        </div>
      )}

      {hasActual && difference > 0 && <p className="text-xs text-[var(--color-ink-soft)]">{t("accounts.surplusHint")}</p>}

      {error && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!hasActual}
          className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-contrast)] shadow-xs transition hover:opacity-90 disabled:opacity-50"
        >
          {difference === 0 ? t("accounts.confirmMatch") : t("accounts.applyCheck")}
        </button>
      </div>
    </form>
  );
};
