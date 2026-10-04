import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SAMPLE_TRANSACTIONS } from "../constants/sampleData";

interface Props {
  income: number;
  onIncome: (income: number) => void;
  onBudget: () => void;
  onFirstTransaction: () => void;
  onDismiss: () => void;
}

type SetupStep = "welcome" | "demo" | "income" | "budget" | "first";

const STEP_TITLES: Record<SetupStep, string> = {
  welcome: "ux.welcome",
  demo: "ux.demoNotice",
  income: "ux.incomeStep",
  budget: "ux.budgetStep",
  first: "ux.firstStep",
};

export function GettingStarted({ income, onIncome, onBudget, onFirstTransaction, onDismiss }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<SetupStep>("welcome");
  const [amount, setAmount] = useState(String(income || ""));

  const primaryBtn =
    "inline-flex items-center justify-center rounded-xl bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-4 py-2 text-sm font-semibold transition active:scale-[0.98] shadow-xs cursor-pointer";
  const secondaryBtn =
    "inline-flex items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-surface-subtle)] active:scale-[0.98] cursor-pointer";

  return (
    <section
      aria-label={t("ux.welcome")}
      className="mb-6 rounded-2xl border border-[var(--primary)]/30 bg-[var(--color-surface)] p-5 sm:p-6 shadow-[var(--shadow-tile)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">
            {t(STEP_TITLES[step] || "ux.welcome")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {t("ux.welcomeDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-2 text-xs text-[var(--color-ink-soft)] underline hover:text-[var(--color-ink)] transition active:scale-[0.98] cursor-pointer"
        >
          {t("ux.skip")}
        </button>
      </div>

      {step === "welcome" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className={primaryBtn} onClick={() => setStep("income")}>
            {t("ux.startReal")}
          </button>
          <button type="button" className={secondaryBtn} onClick={() => setStep("demo")}>
            {t("ux.tryDemo")}
          </button>
        </div>
      )}

      {step === "demo" && (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-line-subtle)]">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--color-line-subtle)]">
                {SAMPLE_TRANSACTIONS.slice(0, 4).map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--color-surface-subtle)]/50 transition-colors">
                    <td className="py-2.5 px-3 text-[var(--color-ink)] font-medium">{tx.name}</td>
                    <td className="py-2.5 px-3 text-[var(--color-ink-soft)]">{t(`category.${tx.category}`)}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-semibold ${
                        tx.amount > 0 ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}฿{Math.abs(tx.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={`${primaryBtn} mt-4`} onClick={() => setStep("income")}>
            {t("ux.backReal")}
          </button>
        </div>
      )}

      {step === "income" && (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            onIncome(Number(amount));
            setStep("budget");
          }}
        >
          <label htmlFor="setup-income" className="block text-sm font-medium text-[var(--color-ink)]">
            {t("ux.incomeStep")}
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            <input
              id="setup-income"
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-60 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="0.00"
            />
            <button type="submit" className={primaryBtn}>
              {t("ux.next")}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{t("ux.incomeHint")}</p>
        </form>
      )}

      {step === "budget" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              onBudget();
              setStep("first");
            }}
          >
            {t("ux.reviewBudget")}
          </button>
          <button
            type="button"
            className="px-3 py-2 text-sm text-[var(--color-ink-soft)] underline hover:text-[var(--color-ink)] transition active:scale-[0.98] cursor-pointer"
            onClick={() => setStep("first")}
          >
            {t("ux.next")}
          </button>
        </div>
      )}

      {step === "first" && (
        <button type="button" className={`${primaryBtn} mt-4`} onClick={onFirstTransaction}>
          {t("ux.firstTransaction")}
        </button>
      )}
    </section>
  );
}
