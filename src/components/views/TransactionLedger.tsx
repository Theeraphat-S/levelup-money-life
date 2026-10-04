import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUUpLeft,
  CheckCircle,
  Circle,
  Funnel,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  Trash,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import { CustomSelect, type CustomSelectOption } from "../common/CustomSelect";
import { CustomDatePicker } from "../common/CustomDatePicker";
import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  TRANSACTION_CATEGORIES,
  type SortField,
  type SortOrder,
  type Transaction,
  type TransactionCategory,
} from "../../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface TransactionLedgerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  activeMonth: string;
  onOpenQuickAdd: () => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  setTransactions,
  activeMonth,
  onOpenQuickAdd,
}) => {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CLEARED" | "PENDING">("ALL");
  const [isMonthScoped, setIsMonthScoped] = useState(true);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [drafts, setDrafts] = useState<Record<string, { name?: string; amount?: string }>>({});
  const [editError, setEditError] = useState("");
  const [lastDeleted, setLastDeleted] = useState<Transaction | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const updateRow = (id: string, patch: Partial<Transaction>) => {
    setTransactions((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const commitDraft = (row: Transaction, field: "name" | "amount") => {
    const draft = drafts[row.id]?.[field];
    if (draft === undefined) return;
    if (field === "name" && !draft.trim()) { setEditError(t("ux.descriptionRequired")); return; }
    if (field === "amount" && (!draft.trim() || !Number.isFinite(Number(draft)) || Number(draft) <= 0)) { setEditError(t("ux.amountRequired")); return; }
    updateRow(row.id, field === "name" ? { name: draft.trim() } : { amount: (row.amount >= 0 ? 1 : -1) * Number(draft) });
    setEditError("");
    setDrafts(previous => ({ ...previous, [row.id]: { ...previous[row.id], [field]: undefined } }));
  };

  const deleteRow = (row: Transaction) => {
    setLastDeleted(row);
    setTransactions((rows) => rows.filter((r) => r.id !== row.id));
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    setTransactions((rows) => [lastDeleted, ...rows.filter((r) => r.id !== lastDeleted.id)]);
    setLastDeleted(null);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
  };

  const categoryFilterOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: t("expense.allCategories") },
      ...TRANSACTION_CATEGORIES.map((c) => ({
        value: c,
        label: t(`category.${c}`),
        colorDot: CATEGORY_COLORS[c],
      })),
    ],
    [t]
  );

  const statusFilterOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: t("expense.allStatus") },
      { value: "CLEARED", label: t("expense.onlyCleared") },
      { value: "PENDING", label: t("expense.onlyPending") },
    ],
    [t]
  );

  const expenseCategoryOptions: CustomSelectOption[] = useMemo(
    () =>
      EXPENSE_CATEGORIES.map((c) => ({
        value: c,
        label: t(`category.${c}`),
        colorDot: CATEGORY_COLORS[c],
      })),
    [t]
  );

  // Filter Transactions
  const filtered = transactions.filter((row) => {
    if (isMonthScoped && !row.date.startsWith(activeMonth)) return false;

    const matchesSearch =
      search.trim() === "" ||
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      t(`category.${row.category}`).toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || row.category === categoryFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CLEARED" && row.cleared) ||
      (statusFilter === "PENDING" && !row.cleared);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort Transactions
  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if (sortField === "date") {
      result = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortField === "amount") {
      result = a.amount - b.amount;
    } else if (sortField === "name") {
      result = a.name.localeCompare(b.name);
    } else if (sortField === "category") {
      result = a.category.localeCompare(b.category);
    }
    return sortOrder === "asc" ? result : -result;
  });

  // Summary Metrics for current view
  const viewIncome = filtered
    .filter((r) => r.amount > 0)
    .reduce((sum, r) => sum + r.amount, 0);

  const viewExpense = filtered
    .filter((r) => r.amount < 0)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);

  const viewNet = viewIncome - viewExpense;

  const activeFilterCount =
    (categoryFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0) + (search ? 1 : 0);

  return (
    <BentoCard
      noPadding
      className="overflow-hidden shadow-sm border border-[var(--color-line)] rounded-3xl"
    >
      {/* Header Deck */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[var(--color-ink)] dark:text-white">
              {t("ledger.title")}
            </h2>
            <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 font-mono text-xs font-bold text-[var(--primary-ink)]">
              {filtered.length} {t("ledger.records")}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            {t("ledger.subtitle")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Scope Toggle */}
          <button
            type="button"
            onClick={() => setIsMonthScoped(!isMonthScoped)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
              isMonthScoped
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-ink)]"
                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            {isMonthScoped ? t("ledger.filterMonthScope") : t("ledger.filterAllScope")}
          </button>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-95"
          >
            <Plus size={15} weight="bold" />
            {t("ledger.newEntry")}
          </button>
        </div>
      </div>

      {/* Undo Banner */}
      <AnimatePresence>
        {lastDeleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between border-b border-[var(--amber)]/30 bg-[var(--amber-soft)] px-6 py-2.5 text-xs font-medium text-[var(--amber-ink)]"
          >
            <span>{t("ledger.deletedNotice", { name: lastDeleted.name })}</span>
            <button
              type="button"
              onClick={undoDelete}
              className="flex items-center gap-1 font-bold underline transition hover:opacity-80"
            >
              <ArrowUUpLeft size={14} weight="bold" />
              {t("ledger.undo")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-3">
        {/* Search */}
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 shadow-xs focus-within:border-[var(--primary)]">
          <MagnifyingGlass size={15} className="text-[var(--color-ink-soft)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("expense.searchPlaceholder")}
            className="w-full bg-transparent text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <Funnel size={14} className="text-[var(--color-ink-soft)]" />
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryFilterOptions}
            ariaLabel={t("expense.category")}
            size="sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as "ALL" | "CLEARED" | "PENDING")}
            options={statusFilterOptions}
            ariaLabel={t("expense.allStatus")}
            size="sm"
          />
        </div>
      </div>

      {/* Summary Band */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-base)] px-6 py-2 text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-[var(--color-ink-soft)]">
            In: <span className="font-bold text-[var(--jade-ink)]">+฿{thb.format(viewIncome)}</span>
          </span>
          <span className="text-[var(--color-ink-soft)]">
            Out: <span className="font-bold text-[var(--rose-ink)]">-฿{thb.format(viewExpense)}</span>
          </span>
          <span className="text-[var(--color-ink-soft)]">
            Net:{" "}
            <span className={`font-bold ${viewNet >= 0 ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"}`}>
              {viewNet >= 0 ? "+" : ""}฿{thb.format(viewNet)}
            </span>
          </span>
        </div>
        {(search || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-sans font-semibold text-[var(--primary-ink)] hover:underline"
          >
            {t("expense.clearFilters")}
          </button>
        )}
      </div>

      {/* Main Table */}
      {editError && <p role="alert" className="mb-3 text-sm text-[var(--rose-ink)]">{editError}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
              <th
                onClick={() => toggleSort("name")}
                className="cursor-pointer px-6 py-3 hover:text-[var(--color-ink)]"
              >
                <div className="flex items-center gap-1">
                  <span>{t("expense.name")}</span>
                  {sortField === "name" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </div>
              </th>
              <th
                onClick={() => toggleSort("category")}
                className="cursor-pointer px-4 py-3 hover:text-[var(--color-ink)]"
              >
                <div className="flex items-center gap-1">
                  <span>{t("expense.category")}</span>
                  {sortField === "category" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </div>
              </th>
              <th
                onClick={() => toggleSort("date")}
                className="cursor-pointer px-4 py-3 hover:text-[var(--color-ink)]"
              >
                <div className="flex items-center gap-1">
                  <span>{t("expense.date")}</span>
                  {sortField === "date" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </div>
              </th>
              <th
                onClick={() => toggleSort("amount")}
                className="cursor-pointer px-4 py-3 text-right hover:text-[var(--color-ink)]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{t("expense.amount")}</span>
                  {sortField === "amount" && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                </div>
              </th>
              <th className="px-4 py-3 text-center">{t("expense.status")}</th>
              <th className="px-6 py-3 text-right">{t("expense.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            <AnimatePresence initial={false}>
              {sorted.map((row) => {
                const isPositive = row.amount >= 0;
                const catColor = CATEGORY_COLORS[row.category] || "var(--color-line)";

                return (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    {/* Name & Notes */}
                    <td className="px-6 py-3">
                      <div>
                        <input
                          type="text"
                          aria-label={t("expense.name")}
                          value={drafts[row.id]?.name ?? row.name}
                          onBlur={() => commitDraft(row, "name")}
                          onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
                          onChange={event => setDrafts(previous => ({ ...previous, [row.id]: { ...previous[row.id], name: event.target.value } }))}
                          className="w-full bg-transparent font-medium text-[var(--color-ink)] outline-none focus:rounded-md focus:bg-[var(--color-surface)] focus:px-1.5 focus:py-0.5 focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        {row.notes && (
                          <div className="text-xs text-[var(--color-ink-soft)] font-medium">
                            {row.notes}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isPositive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--jade)]/30 bg-[var(--jade-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--jade-ink)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--jade)]" />
                          {t(`category.${row.category}`)}
                        </span>
                      ) : (
                        <CustomSelect
                          value={row.category}
                          onChange={(val) =>
                            updateRow(row.id, { category: val as TransactionCategory })
                          }
                          options={expenseCategoryOptions}
                          ariaLabel={t("expense.category")}
                          size="sm"
                        />
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CustomDatePicker
                        value={row.date}
                        onChange={(newDate) => updateRow(row.id, { date: newDate })}
                        ariaLabel={t("expense.date")}
                        size="sm"
                      />
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isPositive ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"
                          }`}
                        >
                          {isPositive ? "+" : "-"}฿
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          aria-label={t("expense.amount")}
                          value={drafts[row.id]?.amount ?? String(Math.abs(row.amount))}
                          onBlur={() => commitDraft(row, "amount")}
                          onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
                          onChange={event => setDrafts(previous => ({ ...previous, [row.id]: { ...previous[row.id], amount: event.target.value } }))}
                          className={`w-24 text-right bg-transparent font-mono text-sm font-bold outline-none focus:rounded-md focus:bg-[var(--color-surface)] focus:px-1 focus:ring-1 focus:ring-[var(--primary)] ${
                            isPositive ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"
                          }`}
                        />
                      </div>
                    </td>

                    {/* Cleared Toggle */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => updateRow(row.id, { cleared: !row.cleared })}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                          row.cleared
                            ? "bg-[var(--jade-soft)] text-[var(--jade-ink)] border border-[var(--jade)]/30"
                            : "bg-[var(--amber-soft)] text-[var(--amber-ink)] border border-[var(--amber)]/30"
                        }`}
                      >
                        {row.cleared ? (
                          <>
                            <ShieldCheck size={12} weight="fill" className="text-[var(--jade)]" />
                            <span>{t("expense.cleared")}</span>
                          </>
                        ) : (
                          <span>{t("expense.pending")}</span>
                        )}
                      </button>
                    </td>

                    {/* Delete Action */}
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => deleteRow(row)}
                        className="rounded-lg p-1.5 text-[var(--color-ink-soft)] transition hover:bg-[var(--rose-soft)] hover:text-[var(--rose-ink)]"
                        aria-label={t("expense.delete")}
                      >
                        <Trash size={15} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-12 text-center">
            <h3 className="text-sm font-bold text-[var(--color-ink)]">
              {t(activeFilterCount ? "expense.noResultsTitle" : "ux.emptyMonth")}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
              {activeFilterCount ? t("expense.noResultsHint") : activeMonth}
            </p>
            <button
              type="button"
              onClick={activeFilterCount ? clearFilters : onOpenQuickAdd}
              className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
            >
              {t(activeFilterCount ? "expense.clearFilters" : "ux.addEntry")}
            </button>
          </div>
        )}
      </div>
    </BentoCard>
  );
};
