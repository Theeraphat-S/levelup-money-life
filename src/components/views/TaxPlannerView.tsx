import React, { useState, useMemo } from "react";
import {
  Calculator,
  Coins,
  ShieldCheck,
  TrendUp,
  Sparkle,
  ArrowsClockwise,
  LightbulbFilament,
  Scales,
  PiggyBank,
  Buildings,
  HeartStraight,
  TreeEvergreen,
  Star,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import { MetricTile } from "../common/MetricTile";
import { calculateThaiTax, getDefaultTaxProfile } from "../../services/taxCalculator";
import type { TaxProfile } from "../../types";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface TaxPlannerViewProps {
  taxProfile: TaxProfile;
  setTaxProfile: (profile: TaxProfile | ((prev: TaxProfile) => TaxProfile)) => void;
  monthlyIncome: number;
  onAwardXp: (amount: number) => void;
}

export const TaxPlannerView: React.FC<TaxPlannerViewProps> = ({
  taxProfile,
  setTaxProfile,
  monthlyIncome,
  onAwardXp,
}) => {
  const { t } = useTranslation();
  const [activeAccordion, setActiveAccordion] = useState<string>("income");

  // Calculate tax results
  const result = useMemo(() => {
    return calculateThaiTax(taxProfile);
  }, [taxProfile]);

  const updateIncome = (key: keyof TaxProfile["income"], val: number) => {
    setTaxProfile((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [key]: Math.max(0, val),
      },
    }));
  };

  const updateAllowance = (key: keyof TaxProfile["allowances"], val: number | boolean) => {
    setTaxProfile((prev) => ({
      ...prev,
      allowances: {
        ...prev.allowances,
        [key]: typeof val === "boolean" ? val : Math.max(0, val),
      },
    }));
  };

  const updateWht = (val: number) => {
    setTaxProfile((prev) => ({
      ...prev,
      withholdingTax: Math.max(0, val),
    }));
  };

  const syncSalaryFromBudget = () => {
    const annualSalary = monthlyIncome * 12;
    updateIncome("salary40_1", annualSalary);
    onAwardXp(15);
  };

  const resetDefaults = () => {
    setTaxProfile(getDefaultTaxProfile(monthlyIncome * 12));
  };

  const applyAdvice = (adviceItem: (typeof result.advice)[0]) => {
    if (adviceItem.category === "thaiESG") {
      updateAllowance("thaiESG", (taxProfile.allowances.thaiESG || 0) + adviceItem.recommendedAmount);
    } else if (adviceItem.category === "rmf") {
      updateAllowance("rmf", (taxProfile.allowances.rmf || 0) + adviceItem.recommendedAmount);
    } else if (adviceItem.category === "ssf") {
      updateAllowance("ssf", (taxProfile.allowances.ssf || 0) + adviceItem.recommendedAmount);
    } else if (adviceItem.category === "insurance") {
      updateAllowance("lifeInsurance", (taxProfile.allowances.lifeInsurance || 0) + adviceItem.recommendedAmount);
    } else if (adviceItem.category === "donation") {
      updateAllowance("educationAndHospitalDonations", (taxProfile.allowances.educationAndHospitalDonations || 0) + adviceItem.recommendedAmount);
    }
    onAwardXp(25);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Controls */}
      <BentoCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary-ink)] shadow-xs mb-2">
              <Calculator size={14} weight="fill" className="text-[var(--primary)]" />
              <span>{t("tax.yearLabel")} {taxProfile.taxYear} (PIT)</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">
              {t("tax.title")}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-soft)] max-w-2xl">
              {t("tax.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={syncSalaryFromBudget}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--primary-ink)] transition hover:opacity-90 active:scale-[0.98] shadow-xs cursor-pointer"
            >
              <ArrowsClockwise size={14} weight="bold" />
              <span>{t("tax.syncSalary", { salary: thb.format(monthlyIncome) })}</span>
            </button>

            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] shadow-xs cursor-pointer"
            >
              {t("tax.resetDefaults")}
            </button>
          </div>
        </div>
      </BentoCard>

      {/* 4 Metric Tiles Deck */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Gross Assessable Income */}
        <MetricTile
          icon={<Coins size={18} weight="duotone" />}
          label={t("tax.metricGrossIncome")}
          value={`฿${thb.format(result.grossAssessableIncome)}`}
          subtext={`40(1): ฿${thb.format(result.totalIncome40_1)} · 40(2): ฿${thb.format(result.totalIncome40_2)}`}
          tone="teal"
        />

        {/* Metric 2: Total Deductions & Allowances */}
        <MetricTile
          icon={<ShieldCheck size={18} weight="duotone" />}
          label={t("tax.metricDeductions")}
          value={`฿${thb.format(result.deductions.totalDeductionsAndAllowances)}`}
          subtext={`Expenses: ฿${thb.format(result.statutoryExpense)} · Allowances: ฿${thb.format(result.deductions.totalDeductionsAndAllowances - result.statutoryExpense)}`}
          tone="jade"
        />

        {/* Metric 3: Net Taxable Income & Marginal Rate */}
        <MetricTile
          icon={<Scales size={18} weight="duotone" />}
          label={t("tax.metricTaxableIncome")}
          value={`฿${thb.format(result.netTaxableIncome)}`}
          subtext={t("tax.marginalBracketBadge", { rate: Math.round(result.marginalTaxRate * 100) })}
          tone="amber"
        />

        {/* Metric 4: Net Tax Payable / Refund */}
        <MetricTile
          icon={<TrendUp size={18} weight="duotone" />}
          label={result.netTaxPayable <= 0 ? t("tax.metricTaxRefund") : t("tax.metricNetTaxPayable")}
          value={result.netTaxPayable <= 0 ? `฿${thb.format(result.taxRefund)}` : `฿${thb.format(result.additionalTaxPayable)}`}
          subtext={`${t("tax.effectiveTaxRate", { rate: result.effectiveTaxRate })} · ${t("tax.whtDeducted", { amount: thb.format(result.withholdingTax) })}`}
          tone={result.netTaxPayable <= 0 ? "jade" : "rose"}
        />
      </div>

      {/* 8 Progressive Brackets Visualizer */}
      <BentoCard>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--color-ink)]">
            {t("tax.brackets.title")}
          </h3>
          <p className="text-xs text-[var(--color-ink-soft)]">
            {t("tax.brackets.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {result.brackets.map((brk) => (
            <div
              key={brk.bracketIndex}
              className={`relative overflow-hidden rounded-xl border p-3.5 transition-all ${
                brk.isCurrentMarginal
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]/30"
                  : brk.taxableInBracket > 0
                  ? "border-[var(--jade)]/30 bg-[var(--jade-soft)]/40"
                  : "border-[var(--color-line)] bg-[var(--color-surface-subtle)] opacity-70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                  {t("tax.brackets.tier", { index: brk.bracketIndex })}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    brk.rate === 0
                      ? "bg-[var(--jade-soft)] text-[var(--jade-ink)]"
                      : brk.isCurrentMarginal
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line)]"
                  }`}
                >
                  {brk.ratePercent}%
                </span>
              </div>

              <div className="mt-2 text-xs font-semibold text-[var(--color-ink)]">
                {brk.maxIncome === Infinity
                  ? `> ฿${thb.format(brk.minIncome)}`
                  : `฿${thb.format(brk.minIncome)} – ฿${thb.format(brk.maxIncome)}`}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-[var(--color-line)] pt-2 text-xs font-mono">
                <span className="text-[var(--color-ink-soft)]">
                  {t("tax.brackets.portion", { amount: thb.format(brk.taxableInBracket) })}
                </span>
                <span className="font-bold text-[var(--color-ink)]">
                  {t("tax.brackets.tax", { amount: thb.format(brk.taxInBracket) })}
                </span>
              </div>

              {brk.isCurrentMarginal && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs font-bold text-[var(--primary-ink)]">
                  <Star size={12} weight="fill" />
                  <span>{t("tax.brackets.activeMarginal")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Live Deduction Cap Progress Meters */}
      <BentoCard>
        <h3 className="text-sm font-bold text-[var(--color-ink)] mb-3">
          {t("tax.meters.retirementCap")} & ThaiESG
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Retirement Group Meter */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--color-ink)]">{t("tax.meters.retirementCap")}</span>
              <span className="font-mono text-[var(--primary-ink)]">
                {t("tax.meters.capUsed", {
                  used: thb.format(result.deductions.retirementGroup),
                  max: thb.format(result.deductions.retirementGroupCapMax),
                })}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4D8E75] to-[#1C5954]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (result.deductions.retirementGroup / result.deductions.retirementGroupCapMax) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* ThaiESG Fund Meter (Independent 300k Pool) */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--jade-soft)] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1 text-[var(--jade-ink)]">
                <TreeEvergreen size={14} weight="fill" className="text-[var(--jade-ink)]" />
                ThaiESG (Independent ฿300k)
              </span>
              <span className="font-mono text-[var(--jade-ink)]">
                {t("tax.meters.capUsed", {
                  used: thb.format(result.deductions.thaiESG),
                  max: thb.format(result.deductions.thaiESGCapMax),
                })}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full bg-[var(--jade)]"
                style={{
                  width: `${
                    result.deductions.thaiESGCapMax > 0
                      ? Math.min(
                          100,
                          Math.round((result.deductions.thaiESG / result.deductions.thaiESGCapMax) * 100)
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Life + Health Combined Meter */}
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--color-ink)]">{t("tax.meters.lifeHealthCap")}</span>
              <span className="font-mono text-[var(--jade-ink)]">
                {t("tax.meters.capUsed", {
                  used: thb.format(
                    Math.min(
                      100000,
                      (taxProfile.allowances.lifeInsurance || 0) +
                        Math.min(25000, taxProfile.allowances.healthInsurance || 0)
                    )
                  ),
                  max: "100,000",
                })}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full bg-[var(--jade)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (Math.min(
                        100000,
                        (taxProfile.allowances.lifeInsurance || 0) +
                          Math.min(25000, taxProfile.allowances.healthInsurance || 0)
                      ) /
                        100000) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Tax Optimization Advisor Cards */}
      {result.advice.length > 0 && (
        <BentoCard>
          <div className="mb-4 flex items-center gap-2">
            <LightbulbFilament size={20} weight="fill" className="text-[var(--amber-ink)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--color-ink)]">
                {t("tax.advisor.title")}
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {t("tax.advisor.subtitle")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {result.advice.map((adv) => (
              <div
                key={adv.id}
                className="flex flex-col justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[var(--jade-soft)] px-2 py-0.5 text-xs font-bold text-[var(--jade-ink)]">
                      {t("tax.advisor.roiBadge", { roi: adv.roiPercent })}
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--jade-ink)]">
                      {t("tax.advisor.potentialSavings", { amount: thb.format(adv.estimatedTaxSavings) })}
                    </span>
                  </div>

                  <h4 className="mt-2.5 text-xs font-bold text-[var(--color-ink)]">
                    {t(adv.titleKey)}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                    {t(adv.descKey, {
                      amount: thb.format(adv.recommendedAmount),
                      savings: thb.format(adv.estimatedTaxSavings),
                      deduction: thb.format(adv.recommendedAmount * 2),
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => applyAdvice(adv)}
                  className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98] cursor-pointer"
                >
                  <Sparkle size={13} weight="fill" />
                  <span>{t("tax.advisor.applyButton")} (+฿{thb.format(adv.recommendedAmount)})</span>
                </button>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* Tabbed / Accordion Form Deck */}
      <BentoCard>
        {/* Accordion Tabs */}
        <div className="flex overflow-x-auto border-b border-[var(--color-line)] pb-2 gap-2 no-scrollbar">
          {[
            { id: "income", label: t("tax.sections.income"), icon: <Coins size={14} /> },
            { id: "personal", label: t("tax.sections.personal"), icon: <HeartStraight size={14} /> },
            { id: "insurance", label: t("tax.sections.insurance"), icon: <ShieldCheck size={14} /> },
            { id: "retirement", label: t("tax.sections.retirement"), icon: <PiggyBank size={14} /> },
            { id: "property", label: t("tax.sections.propertyDonation"), icon: <Buildings size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAccordion(tab.id)}
              className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                activeAccordion === tab.id
                  ? "bg-[#1C5954] text-white dark:bg-[#76AA9D] dark:text-[#071B1A]"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Inputs by Tab */}
        <div className="mt-5 space-y-4">
          {/* Tab 1: Income & WHT */}
          {activeAccordion === "income" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.salary40_1")}
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink-soft)] mr-2">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={taxProfile.income.salary40_1 || 0}
                    onChange={(e) => updateIncome("salary40_1", parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.bonus40_1")}
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink-soft)] mr-2">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={taxProfile.income.bonus40_1 || 0}
                    onChange={(e) => updateIncome("bonus40_1", parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.freelance40_2")}
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink-soft)] mr-2">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={taxProfile.income.freelance40_2 || 0}
                    onChange={(e) => updateIncome("freelance40_2", parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.withholdingTax")}
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2">
                  <span className="font-mono text-sm font-bold text-[var(--color-ink-soft)] mr-2">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={taxProfile.withholdingTax || 0}
                    onChange={(e) => updateWht(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Personal & Family */}
          {activeAccordion === "personal" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-3.5">
                <input
                  type="checkbox"
                  id="spouseCheckbox"
                  checked={taxProfile.allowances.hasSpouseNoIncome}
                  onChange={(e) => updateAllowance("hasSpouseNoIncome", e.target.checked)}
                  className="h-4 w-4 rounded accent-[var(--primary)] cursor-pointer"
                />
                <label htmlFor="spouseCheckbox" className="text-xs font-semibold text-[var(--color-ink)] cursor-pointer">
                  {t("tax.inputs.hasSpouse")}
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.childrenStd")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={taxProfile.allowances.childrenCount || 0}
                  onChange={(e) => updateAllowance("childrenCount", parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.children2018")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={taxProfile.allowances.children2018OnwardsCount || 0}
                  onChange={(e) => updateAllowance("children2018OnwardsCount", parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.parents")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={taxProfile.allowances.parentsCount || 0}
                  onChange={(e) => updateAllowance("parentsCount", parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.disabled")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={taxProfile.allowances.disabledDependentsCount || 0}
                  onChange={(e) => updateAllowance("disabledDependentsCount", parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.antenatal")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="60000"
                  step="1000"
                  value={taxProfile.allowances.antenatalAndDeliveryCost || 0}
                  onChange={(e) => updateAllowance("antenatalAndDeliveryCost", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Insurance & Social Security */}
          {activeAccordion === "insurance" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.socialSecurity")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="9000"
                  step="500"
                  value={taxProfile.allowances.socialSecurity || 0}
                  onChange={(e) => updateAllowance("socialSecurity", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.lifeInsurance")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1000"
                  value={taxProfile.allowances.lifeInsurance || 0}
                  onChange={(e) => updateAllowance("lifeInsurance", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.healthInsurance")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="25000"
                  step="1000"
                  value={taxProfile.allowances.healthInsurance || 0}
                  onChange={(e) => updateAllowance("healthInsurance", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.parentsHealth")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="15000"
                  step="1000"
                  value={taxProfile.allowances.parentsHealthInsurance || 0}
                  onChange={(e) => updateAllowance("parentsHealthInsurance", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Retirement & ThaiESG */}
          {activeAccordion === "retirement" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-full rounded-xl border border-[var(--color-line)] bg-[var(--jade-soft)] p-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--jade-ink)]">
                  <Star size={14} weight="fill" />
                  <span>{t("tax.inputs.thaiESG")}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="300000"
                  step="5000"
                  value={taxProfile.allowances.thaiESG || 0}
                  onChange={(e) => updateAllowance("thaiESG", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.rmf")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="500000"
                  step="5000"
                  value={taxProfile.allowances.rmf || 0}
                  onChange={(e) => updateAllowance("rmf", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.ssf")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="5000"
                  value={taxProfile.allowances.ssf || 0}
                  onChange={(e) => updateAllowance("ssf", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.pvd")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="500000"
                  step="5000"
                  value={taxProfile.allowances.pvdOrGpf || 0}
                  onChange={(e) => updateAllowance("pvdOrGpf", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.annuity")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="5000"
                  value={taxProfile.allowances.annuityInsurance || 0}
                  onChange={(e) => updateAllowance("annuityInsurance", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.nsf")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="30000"
                  step="1000"
                  value={taxProfile.allowances.nsf || 0}
                  onChange={(e) => updateAllowance("nsf", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Property & Donations */}
          {activeAccordion === "property" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.homeLoan")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1000"
                  value={taxProfile.allowances.homeLoanInterest || 0}
                  onChange={(e) => updateAllowance("homeLoanInterest", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.eduHospDonation")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={taxProfile.allowances.educationAndHospitalDonations || 0}
                  onChange={(e) => updateAllowance("educationAndHospitalDonations", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.generalDonation")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={taxProfile.allowances.generalDonations || 0}
                  onChange={(e) => updateAllowance("generalDonations", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-ink)]">
                  {t("tax.inputs.politicalDonation")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="500"
                  value={taxProfile.allowances.politicalPartyDonations || 0}
                  onChange={(e) => updateAllowance("politicalPartyDonations", parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-ink)] outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </BentoCard>
    </div>
  );
};
