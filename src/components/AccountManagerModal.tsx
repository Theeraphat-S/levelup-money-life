import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../constants/motion";
import {
  ArrowRight,
  Bank,
  CreditCard,
  DeviceMobile,
  Money,
  PencilSimple,
  Plus,
  Star,
  Trash,
  X,
  Archive,
  Scales,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useDialogFocus } from "../hooks/useDialogFocus";
import { getLocalTodayISO } from "../utils/safeToSpend";
import { ACCOUNT_TYPES, type Account, type AccountType, type Transaction, type Transfer } from "../types";
import {
  ACCOUNT_TYPE_ORDER,
  computeAccountBalances,
  computeNetWorth,
  isAccountReferenced,
  isAliasTaken,
  normalizeAlias,
  validateTransfer,
} from "../utils/accounts";
import { CustomSelect } from "./common/CustomSelect";
import { CustomDatePicker } from "./common/CustomDatePicker";
import { BalanceCheckPanel } from "./BalanceCheckPanel";

export const ACCOUNT_TYPE_ICONS: Record<AccountType, typeof Bank> = {
  cash: Money,
  bank: Bank,
  ewallet: DeviceMobile,
  credit: CreditCard,
};

const formatBaht = (value: number) =>
  `${value < 0 ? "-" : ""}฿${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transfers: Transfer[];
  transactions: Transaction[];
  defaultAccountId: string;
  onSaveAccount: (account: Account) => void;
  onSetArchived: (id: string, archived: boolean) => void;
  onDeleteAccount: (id: string) => void;
  onSetDefault: (id: string) => void;
  onAddTransfer: (transfer: Transfer) => void;
  onDeleteTransfer: (id: string) => void;
  onApplyBalanceCheck?: (account: Account, transactions: Transaction[]) => void;
}

type AccountDraft = {
  id?: string;
  name: string;
  type: AccountType;
  opening: string;
  alias: string;
  statementDay: string;
  dueDay: string;
};

const EMPTY_DRAFT: AccountDraft = { name: "", type: "bank", opening: "", alias: "", statementDay: "", dueDay: "" };

const ALIAS_PATTERN = /^[\w\u0E00-\u0E7F-]+$/;

function parseDay(value: string): number | undefined | null {
  if (!value.trim()) return undefined;
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

const inputClass =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--primary)] shadow-xs";
const labelClass = "block text-xs font-semibold text-[var(--color-ink-soft)] mb-1";

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transfers,
  transactions,
  defaultAccountId,
  onSaveAccount,
  onSetArchived,
  onDeleteAccount,
  onSetDefault,
  onAddTransfer,
  onDeleteTransfer,
  onApplyBalanceCheck,
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialogRef);

  const [draft, setDraft] = useState<AccountDraft | null>(null);
  const [formError, setFormError] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
  const archivedCount = accounts.length - activeAccounts.length;
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(getLocalTodayISO());
  const [transferNote, setTransferNote] = useState("");
  const [transferError, setTransferError] = useState("");
  const [checkId, setCheckId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(null);
    setCheckId(null);
    setFormError("");
    setTransferError("");
    setTransferAmount("");
    setTransferNote("");
    setTransferDate(getLocalTodayISO());
  }, [isOpen]);

  // Keep the transfer pickers pointing at two distinct active accounts
  useEffect(() => {
    if (!isOpen) return;
    const ids = activeAccounts.map((a) => a.id);
    const nextFrom = ids.includes(fromId) ? fromId : ids.includes(defaultAccountId) ? defaultAccountId : ids[0] ?? "";
    const nextTo = ids.includes(toId) && toId !== nextFrom ? toId : ids.find((id) => id !== nextFrom) ?? "";
    setFromId(nextFrom);
    setToId(nextTo);
  }, [isOpen, activeAccounts, defaultAccountId, fromId, toId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const balances = useMemo(
    () => computeAccountBalances(accounts, transactions, transfers),
    [accounts, transactions, transfers]
  );
  const netWorth = computeNetWorth(balances);

  const visibleAccounts = useMemo(
    () =>
      accounts
        .filter((a) => showArchived || !a.archived)
        .sort((a, b) => Number(a.archived) - Number(b.archived) || ACCOUNT_TYPE_ORDER[a.type] - ACCOUNT_TYPE_ORDER[b.type]),
    [accounts, showArchived]
  );

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "—";

  const startEdit = (account: Account) => {
    setFormError("");
    setDraft({
      id: account.id,
      name: account.name,
      type: account.type,
      opening: String(account.type === "credit" ? -account.openingBalance : account.openingBalance),
      alias: account.alias ?? "",
      statementDay: account.statementDay ? String(account.statementDay) : "",
      dueDay: account.dueDay ? String(account.dueDay) : "",
    });
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setFormError(t("accounts.errors.nameRequired"));
      return;
    }
    const raw = draft.opening.trim() === "" ? 0 : Number(draft.opening);
    if (!Number.isFinite(raw)) {
      setFormError(t("accounts.errors.invalidAmount"));
      return;
    }
    const alias = normalizeAlias(draft.alias);
    if (alias && !ALIAS_PATTERN.test(alias)) {
      setFormError(t("accounts.aliasInvalid"));
      return;
    }
    if (isAliasTaken(alias, accounts, draft.id)) {
      setFormError(t("accounts.aliasTaken"));
      return;
    }
    const isCredit = draft.type === "credit";
    const statementDay = isCredit ? parseDay(draft.statementDay) : undefined;
    const dueDay = isCredit ? parseDay(draft.dueDay) : undefined;
    if (statementDay === null || dueDay === null || (statementDay === undefined) !== (dueDay === undefined)) {
      setFormError(t("accounts.errors.cycleDays"));
      return;
    }
    // Credit cards are entered as an amount owed and stored as a negative balance
    const openingBalance = isCredit ? -Math.abs(raw) : raw;
    const existing = accounts.find((a) => a.id === draft.id);
    onSaveAccount({
      archived: existing?.archived ?? false,
      createdAt: existing?.createdAt ?? getLocalTodayISO(),
      id: existing?.id ?? crypto.randomUUID(),
      name: draft.name,
      type: draft.type,
      openingBalance,
      alias,
      ...(statementDay && dueDay ? { statementDay, dueDay } : {}),
    });
    setDraft(null);
  };

  const handleRemove = (account: Account) => {
    if (!account.archived && activeAccounts.length <= 1) {
      setFormError(t("accounts.errors.lastActive"));
      return;
    }
    setFormError("");
    if (isAccountReferenced(account.id, transactions, transfers)) onSetArchived(account.id, true);
    else onDeleteAccount(account.id);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const transfer = {
      fromAccountId: fromId,
      toAccountId: toId,
      amount: Number(transferAmount),
      date: transferDate,
      notes: transferNote.trim() || undefined,
    };
    const error = validateTransfer(transfer, accounts);
    if (error) {
      setTransferError(t(`accounts.errors.${error}`));
      return;
    }
    onAddTransfer({ id: crypto.randomUUID(), ...transfer });
    setTransferError("");
    setTransferAmount("");
    setTransferNote("");
  };

  const accountOptions = activeAccounts.map((a) => {
    const Icon = ACCOUNT_TYPE_ICONS[a.type];
    return { value: a.id, label: a.name, textValue: a.name, icon: <Icon size={14} weight="duotone" /> };
  });

  const recentTransfers = [...transfers].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

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
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={SPRING.overlay}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl z-10 max-h-[90dvh] flex flex-col"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-4">
              <div>
                <h2 id="account-modal-title" className="text-base font-bold tracking-tight text-[var(--color-ink)]">
                  {t("accounts.title")}
                </h2>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{t("accounts.subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("ux.close")}
                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-line-subtle)] hover:text-[var(--color-ink)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Net worth */}
              <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-4 py-3">
                <div className="text-xs font-semibold text-[var(--color-ink-soft)]">{t("accounts.netWorth")}</div>
                <div
                  className={`font-mono text-2xl font-bold tabular-nums ${netWorth < 0 ? "text-[var(--rose-ink)]" : "text-[var(--color-ink)]"}`}
                  data-testid="net-worth"
                >
                  {formatBaht(netWorth)}
                </div>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{t("accounts.netWorthHint")}</p>
              </section>

              {/* Account list */}
              <section>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider">
                    {t("accounts.title")} ({activeAccounts.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {archivedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowArchived((v) => !v)}
                        aria-pressed={showArchived}
                        className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
                      >
                        {t("accounts.showArchived", { count: archivedCount })}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setFormError(""); setCheckId(null); setDraft({ ...EMPTY_DRAFT }); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] text-[var(--primary-contrast)] px-2.5 py-1 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                    >
                      <Plus size={14} weight="bold" />
                      <span>{t("accounts.add")}</span>
                    </button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {visibleAccounts.map((account) => {
                    const Icon = ACCOUNT_TYPE_ICONS[account.type];
                    const balance = balances[account.id] ?? 0;
                    const isCredit = account.type === "credit";
                    const isDefault = account.id === defaultAccountId;
                    const referenced = isAccountReferenced(account.id, transactions, transfers);
                    return (
                      <li
                        key={account.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                          draft?.id === account.id
                            ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                            : "border-[var(--color-line)] bg-[var(--color-surface-subtle)]"
                        } ${account.archived ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--primary)]">
                            <Icon size={18} weight="duotone" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-ink)]">
                              <span className="truncate">{account.name}</span>
                              {isDefault && (
                                <span className="shrink-0 rounded-md border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-1.5 text-xs font-semibold text-[var(--primary-ink)]">
                                  {t("accounts.default")}
                                </span>
                              )}
                              {account.archived && (
                                <span className="shrink-0 rounded-md border border-[var(--color-line)] px-1.5 text-xs font-semibold text-[var(--color-ink-soft)]">
                                  {t("accounts.archived")}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--color-ink-soft)]">
                              {t(`accounts.types.${account.type}`)}
                              {account.alias && <span className="font-mono"> · @{account.alias}</span>}
                              {account.lastBalanceCheck && <span> · {t("accounts.lastChecked", { date: account.lastBalanceCheck })}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-[var(--color-ink-soft)]">
                              {isCredit && balance <= 0 ? t("accounts.owed") : t("accounts.balance")}
                            </div>
                            <div
                              className={`font-mono text-sm font-bold tabular-nums ${
                                balance < 0 && !isCredit ? "text-[var(--rose-ink)]" : "text-[var(--color-ink)]"
                              }`}
                            >
                              {isCredit && balance <= 0 ? formatBaht(-balance) : formatBaht(balance)}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {!account.archived && onApplyBalanceCheck && (
                              <button
                                type="button"
                                onClick={() => { setDraft(null); setCheckId(account.id); }}
                                title={t("accounts.check")}
                                aria-label={`${t("accounts.check")}: ${account.name}`}
                                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition"
                              >
                                <Scales size={15} />
                              </button>
                            )}
                            {!account.archived && !isDefault && (
                              <button
                                type="button"
                                onClick={() => onSetDefault(account.id)}
                                title={t("accounts.makeDefault")}
                                aria-label={`${t("accounts.makeDefault")}: ${account.name}`}
                                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition"
                              >
                                <Star size={15} />
                              </button>
                            )}
                            {!account.archived && (
                              <button
                                type="button"
                                onClick={() => startEdit(account)}
                                title={t("accounts.edit")}
                                aria-label={`${t("accounts.edit")}: ${account.name}`}
                                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition"
                              >
                                <PencilSimple size={15} />
                              </button>
                            )}
                            {account.archived ? (
                              <button
                                type="button"
                                onClick={() => onSetArchived(account.id, false)}
                                title={t("accounts.unarchive")}
                                aria-label={`${t("accounts.unarchive")}: ${account.name}`}
                                className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] transition"
                              >
                                <ArrowCounterClockwise size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemove(account)}
                                title={referenced ? `${t("accounts.archive")} — ${t("accounts.archiveHint")}` : t("accounts.delete")}
                                aria-label={`${referenced ? t("accounts.archive") : t("accounts.delete")}: ${account.name}`}
                                className="rounded-lg p-1.5 text-[var(--rose-ink)] hover:bg-[var(--rose-soft)] transition"
                              >
                                {referenced ? <Archive size={15} /> : <Trash size={15} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{t("accounts.defaultHint")}</p>
                {formError && !draft && (
                  <p role="alert" className="mt-2 text-xs font-semibold text-[var(--rose-ink)]">{formError}</p>
                )}
              </section>

              {/* Balance check */}
              {checkId && onApplyBalanceCheck && accounts.some((a) => a.id === checkId) && (
                <BalanceCheckPanel
                  key={checkId}
                  account={accounts.find((a) => a.id === checkId) as Account}
                  recordedBalance={balances[checkId] ?? 0}
                  onApply={(account, txs) => { onApplyBalanceCheck(account, txs); setCheckId(null); }}
                  onCancel={() => setCheckId(null)}
                />
              )}

              {/* Add / edit form */}
              {draft && (
                <form
                  onSubmit={handleSaveAccount}
                  className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/20 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-ink)]">
                      {draft.id ? t("accounts.editTitle") : t("accounts.add")}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setDraft(null)}
                      className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    >
                      {t("accounts.cancel")}
                    </button>
                  </div>

                  <fieldset>
                    <legend className={labelClass}>{t("accounts.type")}</legend>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {ACCOUNT_TYPES.map((type) => {
                        const Icon = ACCOUNT_TYPE_ICONS[type];
                        const selected = draft.type === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setDraft({ ...draft, type })}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                              selected
                                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-ink)]"
                                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                            }`}
                          >
                            <Icon size={15} weight="duotone" />
                            {t(`accounts.types.${type}`)}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="account-name" className={labelClass}>{t("accounts.name")}</label>
                      <input
                        id="account-name"
                        type="text"
                        autoFocus
                        value={draft.name}
                        placeholder={t("accounts.namePlaceholder")}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="account-opening" className={labelClass}>
                        {draft.type === "credit" ? t("accounts.openingOwed") : t("accounts.openingBalance")}
                      </label>
                      <input
                        id="account-opening"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={draft.opening}
                        placeholder="0"
                        onChange={(e) => setDraft({ ...draft, opening: e.target.value })}
                        className={`${inputClass} font-mono`}
                        aria-describedby="account-opening-hint"
                      />
                      <p id="account-opening-hint" className="mt-1 text-xs text-[var(--color-ink-soft)]">{t("accounts.openingHint")}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="account-alias" className={labelClass}>{t("accounts.alias")}</label>
                    <div className="flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 shadow-xs focus-within:border-[var(--primary)] sm:max-w-[50%]">
                      <span className="font-mono text-sm text-[var(--color-ink-soft)]" aria-hidden>@</span>
                      <input
                        id="account-alias"
                        type="text"
                        maxLength={16}
                        value={draft.alias}
                        placeholder="kb"
                        onChange={(e) => setDraft({ ...draft, alias: e.target.value })}
                        className="w-full bg-transparent px-1 py-2 font-mono text-sm text-[var(--color-ink)] outline-none"
                        aria-describedby="account-alias-hint"
                      />
                    </div>
                    <p id="account-alias-hint" className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      {t("accounts.aliasHint", { alias: normalizeAlias(draft.alias) ?? "kb" })}
                    </p>
                  </div>

                  {draft.type === "credit" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="account-statement-day" className={labelClass}>{t("accounts.statementDay")}</label>
                        <input
                          id="account-statement-day"
                          type="number"
                          min="1"
                          max="31"
                          value={draft.statementDay}
                          onChange={(e) => setDraft({ ...draft, statementDay: e.target.value })}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label htmlFor="account-due-day" className={labelClass}>{t("accounts.dueDay")}</label>
                        <input
                          id="account-due-day"
                          type="number"
                          min="1"
                          max="31"
                          value={draft.dueDay}
                          onChange={(e) => setDraft({ ...draft, dueDay: e.target.value })}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <p className="col-span-2 -mt-1 text-xs text-[var(--color-ink-soft)]">{t("accounts.cycleHint")}</p>
                    </div>
                  )}

                  {formError && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{formError}</p>}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-[var(--primary)] text-[var(--primary-contrast)] px-4 py-2 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                    >
                      {t("accounts.save")}
                    </button>
                  </div>
                </form>
              )}

              {/* Transfers */}
              {activeAccounts.length >= 2 && (
                <section className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider">{t("accounts.transferTitle")}</h3>
                    <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{t("accounts.transferHint")}</p>
                  </div>
                  <form onSubmit={handleTransfer} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <div>
                        <span className={labelClass}>{t("accounts.from")}</span>
                        <CustomSelect value={fromId} onChange={setFromId} options={accountOptions} ariaLabel={t("accounts.from")} className="w-full" />
                      </div>
                      <ArrowRight size={16} className="hidden sm:block mb-2.5 text-[var(--color-ink-soft)]" aria-hidden />
                      <div>
                        <span className={labelClass}>{t("accounts.to")}</span>
                        <CustomSelect value={toId} onChange={setToId} options={accountOptions} ariaLabel={t("accounts.to")} className="w-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="transfer-amount" className={labelClass}>{t("accounts.amount")}</label>
                        <input
                          id="transfer-amount"
                          type="number"
                          step="any"
                          min="0"
                          inputMode="decimal"
                          value={transferAmount}
                          placeholder="0.00"
                          onChange={(e) => setTransferAmount(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <span className={labelClass}>{t("accounts.date")}</span>
                        <CustomDatePicker value={transferDate} onChange={setTransferDate} ariaLabel={t("accounts.date")} className="w-full" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="transfer-note" className={labelClass}>{t("accounts.note")}</label>
                      <input
                        id="transfer-note"
                        type="text"
                        value={transferNote}
                        onChange={(e) => setTransferNote(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    {transferError && <p role="alert" className="text-xs font-semibold text-[var(--rose-ink)]">{transferError}</p>}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="rounded-xl bg-[var(--primary)] text-[var(--primary-contrast)] px-4 py-2 text-xs font-semibold shadow-xs hover:opacity-90 transition"
                      >
                        {t("accounts.recordTransfer")}
                      </button>
                    </div>
                  </form>

                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">{t("accounts.recentTransfers")}</h4>
                    {recentTransfers.length === 0 ? (
                      <p className="text-xs text-[var(--color-ink-soft)]">{t("accounts.noTransfers")}</p>
                    ) : (
                      <ul className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
                        {recentTransfers.map((transfer) => (
                          <li key={transfer.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]">
                                <span className="truncate">{accountName(transfer.fromAccountId)}</span>
                                <ArrowRight size={12} className="shrink-0 text-[var(--color-ink-soft)]" aria-label={t("accounts.to")} />
                                <span className="truncate">{accountName(transfer.toAccountId)}</span>
                              </div>
                              <div className="font-mono text-[var(--color-ink-soft)]">
                                {transfer.date}{transfer.notes ? ` · ${transfer.notes}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold tabular-nums text-[var(--color-ink)]">{formatBaht(transfer.amount)}</span>
                              <button
                                type="button"
                                onClick={() => onDeleteTransfer(transfer.id)}
                                aria-label={t("accounts.deleteTransfer")}
                                title={t("accounts.deleteTransfer")}
                                className="rounded-lg p-1 text-[var(--rose-ink)] hover:bg-[var(--rose-soft)] transition"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
