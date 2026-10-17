import React, { useMemo } from "react";
import { ArrowRight, Bank } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { Account, Transaction, Transfer } from "../types";
import { ACCOUNT_TYPE_ORDER, computeAccountBalances, computeNetWorth } from "../utils/accounts";
import { ACCOUNT_TYPE_ICONS } from "./AccountManagerModal";
import { BentoCard } from "./common/BentoCard";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface AccountBalancesCardProps {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  onOpenAccounts: () => void;
}

/** Real balances per account; complements Safe-to-Spend, which is a budget estimate. */
export const AccountBalancesCard: React.FC<AccountBalancesCardProps> = ({ accounts, transactions, transfers, onOpenAccounts }) => {
  const { t } = useTranslation();
  const balances = useMemo(() => computeAccountBalances(accounts, transactions, transfers), [accounts, transactions, transfers]);
  const active = accounts
    .filter((a) => !a.archived)
    .sort((a, b) => ACCOUNT_TYPE_ORDER[a.type] - ACCOUNT_TYPE_ORDER[b.type]);
  const netWorth = computeNetWorth(balances);

  return (
    <BentoCard
      className="h-full"
      header={
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-[var(--color-ink)]">
            <Bank size={19} weight="duotone" className="text-[var(--primary)]" />
            {t("accounts.title")}
          </h2>
          <button type="button" onClick={onOpenAccounts} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-ink)] transition hover:underline">
            {t("dashboard.manageAccounts")}
            <ArrowRight size={13} />
          </button>
        </div>
      }
    >
      <p className="text-xs font-semibold text-[var(--color-ink-soft)]">{t("accounts.netWorth")}</p>
      <p className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${netWorth < 0 ? "text-[var(--rose-ink)]" : "text-[var(--color-ink)]"}`}>
        {netWorth < 0 ? "-" : ""}฿{thb.format(Math.abs(netWorth))}
      </p>
      <ul className="mt-3 space-y-1.5">
        {active.map((account) => {
          const Icon = ACCOUNT_TYPE_ICONS[account.type];
          const balance = balances[account.id] ?? 0;
          const owed = account.type === "credit" && balance <= 0;
          return (
            <li key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <Icon size={16} weight="duotone" className="shrink-0 text-[var(--primary)]" aria-hidden />
                <span className="truncate font-semibold text-[var(--color-ink)]">{account.name}</span>
              </span>
              <span className="shrink-0 text-right">
                {owed && <span className="mr-1.5 text-[var(--color-ink-soft)]">{t("accounts.owed")}</span>}
                <span className={`font-mono font-bold tabular-nums ${balance < 0 && !owed ? "text-[var(--rose-ink)]" : "text-[var(--color-ink)]"}`}>
                  {!owed && balance < 0 ? "-" : ""}฿{thb.format(Math.abs(balance))}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </BentoCard>
  );
};
