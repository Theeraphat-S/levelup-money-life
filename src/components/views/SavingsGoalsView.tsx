import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AirplaneTilt,
  ArrowDown,
  ArrowUp,
  Calculator,
  Car,
  CheckCircle,
  Gift,
  GraduationCap,
  House,
  Laptop,
  PencilSimple,
  PiggyBank,
  Plus,
  ShieldCheck,
  Sparkle,
  Target,
  Trash,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import { TactileButton } from "../common/TactileButton";
import { AnimatedCounter } from "../common/AnimatedCounter";
import { FloatingReward, type FloatingRewardItem } from "../common/FloatingReward";
import type { SavingsGoal, SavingsGoalCategory, Transaction } from "../../types";
import {
  calculateEmergencyFundTarget,
  calculateSavingsPace,
  SAVINGS_MILESTONES,
  SAVINGS_MILESTONE_XP,
  XP_PER_SAVINGS_DEPOSIT,
} from "../../utils/savingsGoals";

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck size={20} weight="fill" />,
  AirplaneTilt: <AirplaneTilt size={20} weight="fill" />,
  Laptop: <Laptop size={20} weight="fill" />,
  House: <House size={20} weight="fill" />,
  Car: <Car size={20} weight="fill" />,
  Gift: <Gift size={20} weight="fill" />,
  GraduationCap: <GraduationCap size={20} weight="fill" />,
  PiggyBank: <PiggyBank size={20} weight="fill" />,
};

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  isLoading: boolean;
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  onCreateGoal: (
    data: Omit<
      SavingsGoal,
      "id" | "currentAmount" | "status" | "milestonesReached" | "createdAt" | "updatedAt"
    >
  ) => Promise<SavingsGoal>;
  onUpdateGoal: (goal: SavingsGoal) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onDeposit: (
    goalId: string,
    amount: number,
    note?: string
  ) => Promise<{ newlyReachedMilestones: number[]; xpEarned: number }>;
  onWithdraw: (goalId: string, amount: number, note?: string) => Promise<void>;
  transactions: Transaction[];
  activeMonth: string;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  goals,
  totalSaved,
  activeGoalsCount,
  completedGoalsCount,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDeposit,
  onWithdraw,
  transactions,
  activeMonth,
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  // Floating rewards queue for milestone XP pops
  const [floatingRewards, setFloatingRewards] = useState<FloatingRewardItem[]>([]);

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [depositNote, setDepositNote] = useState<string>("");

  const [withdrawModalGoal, setWithdrawModalGoal] = useState<SavingsGoal | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawNote, setWithdrawNote] = useState<string>("");

  const [isEmergencyCalcOpen, setIsEmergencyCalcOpen] = useState(false);
  const [emergencyMonths, setEmergencyMonths] = useState<3 | 6>(6);

  // Form state for creating/editing goal
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<SavingsGoalCategory>("emergency");
  const [formTargetAmount, setFormTargetAmount] = useState<number>(50000);
  const [formTargetDate, setFormTargetDate] = useState<string>("");
  const [formIcon, setFormIcon] = useState<string>("ShieldCheck");

  // Calculate monthly required pace across all active goals
  const totalRequiredMonthlyPace = useMemo(() => {
    return goals
      .filter((g) => g.status === "active")
      .reduce((sum, g) => {
        const pace = calculateSavingsPace(g);
        return sum + pace.requiredPerMonth;
      }, 0);
  }, [goals]);

  // Compute average monthly expense across historical transactions for emergency fund calculator
  const monthlyExpenseEstimate = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.amount < 0 && t.category !== "Savings") {
        const m = t.date ? t.date.slice(0, 7) : "";
        if (m) {
          monthlyTotals[m] = (monthlyTotals[m] || 0) + Math.abs(t.amount);
        }
      }
    });
    const months = Object.values(monthlyTotals);
    if (months.length === 0) return 25000;
    const avg = Math.round(months.reduce((sum, v) => sum + v, 0) / months.length);
    return avg > 0 ? avg : 25000;
  }, [transactions]);

  const emergencyTargetCalculated = useMemo(() => {
    return calculateEmergencyFundTarget(monthlyExpenseEstimate, emergencyMonths);
  }, [monthlyExpenseEstimate, emergencyMonths]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingGoal(null);
    setFormTitle("");
    setFormCategory("general");
    setFormTargetAmount(30000);
    setFormTargetDate("");
    setFormIcon("PiggyBank");
    setIsGoalModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormCategory(goal.category);
    setFormTargetAmount(goal.targetAmount);
    setFormTargetDate(goal.targetDate || "");
    setFormIcon(goal.icon || "PiggyBank");
    setIsGoalModalOpen(true);
  };

  // Handle Save Goal
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formTargetAmount <= 0) return;

    if (editingGoal) {
      await onUpdateGoal({
        ...editingGoal,
        title: formTitle.trim(),
        category: formCategory,
        targetAmount: formTargetAmount,
        targetDate: formTargetDate ? formTargetDate : undefined,
        icon: formIcon,
      });
    } else {
      await onCreateGoal({
        title: formTitle.trim(),
        category: formCategory,
        targetAmount: formTargetAmount,
        targetDate: formTargetDate ? formTargetDate : undefined,
        icon: formIcon,
      });
    }

    setIsGoalModalOpen(false);
  };

  // Handle Submit Deposit
  const handleSubmitDeposit = async () => {
    if (!depositModalGoal || depositAmount <= 0) return;

    const res = await onDeposit(depositModalGoal.id, depositAmount, depositNote);

    // If milestone reached, trigger floating reward with full cumulative earned XP
    if (res.newlyReachedMilestones.length > 0) {
      const highest = Math.max(...res.newlyReachedMilestones);
      setFloatingRewards((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: `+${res.xpEarned} XP (${highest}% Milestone!)`,
          type: "xp",
          x: window.innerWidth / 2,
          y: window.innerHeight / 3,
        },
      ]);
    }

    setDepositModalGoal(null);
    setDepositAmount(1000);
    setDepositNote("");
  };

  // Handle Submit Withdraw
  const handleSubmitWithdraw = async () => {
    if (!withdrawModalGoal || withdrawAmount <= 0) return;
    await onWithdraw(withdrawModalGoal.id, withdrawAmount, withdrawNote);
    setWithdrawModalGoal(null);
    setWithdrawAmount(500);
    setWithdrawNote("");
  };

  // Apply Emergency Fund Target
  const handleApplyEmergencyFund = async () => {
    const existing = goals.find((g) => g.category === "emergency");
    if (existing) {
      await onUpdateGoal({
        ...existing,
        targetAmount: emergencyTargetCalculated,
      });
    } else {
      await onCreateGoal({
        title: t("savings.emergencyTitleFormatted", { months: emergencyMonths }),
        category: "emergency",
        targetAmount: emergencyTargetCalculated,
        icon: "ShieldCheck",
      });
    }
    setIsEmergencyCalcOpen(false);
  };

  return (
    <div className="space-y-6">
      <FloatingReward
        rewards={floatingRewards}
        onComplete={(id) => setFloatingRewards((prev) => prev.filter((r) => r.id !== id))}
      />

      {/* Hero Header & KPI Deck */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-ink)] flex items-center gap-2">
            <PiggyBank size={28} className="text-[var(--jade)]" weight="fill" />
            {t("savings.title")}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-ink-soft)]">
            {t("savings.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <TactileButton
            onClick={() => setIsEmergencyCalcOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-xs hover:border-[var(--jade)]/40 hover:bg-[var(--jade-soft)]/20"
          >
            <ShieldCheck size={16} className="text-[var(--jade)]" weight="fill" />
            <span>{t("savings.emergencyCalc")}</span>
          </TactileButton>

          <TactileButton
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[#1C5954] px-4 py-2 text-xs font-bold text-[#FEFFFC] shadow-sm hover:brightness-110 dark:bg-[#76AA9D] dark:text-[#071B1A]"
          >
            <Plus size={16} weight="bold" />
            <span>{t("savings.newGoal")}</span>
          </TactileButton>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
              {t("savings.totalSaved")}
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--jade-soft)] text-[var(--jade)]">
              <PiggyBank size={18} weight="fill" />
            </div>
          </div>
          <div className="mt-3">
            <AnimatedCounter
              value={totalSaved}
              prefix="฿"
              className="font-mono text-2xl font-black text-[var(--color-ink)]"
            />
          </div>
        </BentoCard>

        <BentoCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
              {t("savings.activeGoals")}
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Target size={18} weight="bold" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-black text-[var(--color-ink)]">
              {activeGoalsCount}
            </span>
            <span className="text-xs text-[var(--color-ink-soft)]">
              / {goals.length} {t("savings.activeGoals")}
            </span>
          </div>
        </BentoCard>

        <BentoCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
              {t("savings.completedGoals")}
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--amber-soft)] text-[var(--amber)]">
              <CheckCircle size={18} weight="fill" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl font-black text-[var(--jade-ink)]">
              {completedGoalsCount}
            </span>
          </div>
        </BentoCard>

        <BentoCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
              {t("savings.requiredPace")}
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)]">
              <Calculator size={18} weight="bold" />
            </div>
          </div>
          <div className="mt-3">
            <AnimatedCounter
              value={totalRequiredMonthlyPace}
              prefix="฿"
              suffix=" / mo"
              className="font-mono text-xl font-black text-[var(--primary)]"
            />
            <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
              {t("savings.monthlyPaceDesc")}
            </p>
          </div>
        </BentoCard>
      </div>

      {/* Goals List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pace = calculateSavingsPace(goal);
          const isCompleted = goal.status === "completed" || pace.status === "completed";

          return (
            <BentoCard key={goal.id} className="p-5 flex flex-col justify-between">
              <div>
                {/* Card Header: Icon, Title & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-11 w-11 place-items-center rounded-2xl border text-xl"
                      style={{
                        backgroundColor: goal.color ? `${goal.color}15` : "var(--jade-soft)",
                        borderColor: goal.color ? `${goal.color}30` : "var(--color-line)",
                        color: goal.color || "var(--jade-ink)",
                      }}
                    >
                      {CATEGORY_ICONS[goal.icon] || <PiggyBank size={22} weight="fill" />}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                        {goal.title}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--jade-soft)] px-2 py-0.5 text-xs font-bold text-[var(--jade-ink)] border border-[var(--jade)]/30">
                            <CheckCircle size={12} weight="fill" />
                            {t("savings.completed")}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {t(`savings.categories.${goal.category}`)}
                      </p>
                    </div>
                  </div>

                  {/* Edit / Delete action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(goal)}
                      title={t("savings.edit")}
                      aria-label={t("savings.edit")}
                      className="p-1.5 rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] active:scale-[0.98] transition"
                    >
                      <PencilSimple size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t("savings.confirmDelete"))) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      title={t("savings.delete")}
                      aria-label={t("savings.delete")}
                      className="p-1.5 rounded-lg text-[var(--color-ink-faint)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose)] active:scale-[0.98] transition"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Numbers */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono text-base font-black text-[var(--color-ink)]">
                      ฿{thb.format(goal.currentAmount)}{" "}
                      <span className="text-xs font-normal text-[var(--color-ink-soft)]">
                        / ฿{thb.format(goal.targetAmount)}
                      </span>
                    </span>
                    <span className="font-mono font-bold text-xs text-[var(--jade-ink)] bg-[var(--jade-soft)] px-2 py-0.5 rounded-md border border-[var(--jade)]/20">
                      {pace.progressPercent}%
                    </span>
                  </div>

                  {/* Multi-milestone Progress Bar */}
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-line-subtle)] border border-[var(--color-line)]/40">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#1C5954] to-[#4D8E75] dark:from-[#76AA9D] dark:to-[#8BB999]"
                      initial={{ width: 0 }}
                      animate={{ width: `${pace.progressPercent}%` }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
                      }
                    />
                  </div>

                  {/* Milestone Pins */}
                  <div className="flex justify-between items-center px-1 pt-0.5 text-xs font-mono text-[var(--color-ink-faint)]">
                    {SAVINGS_MILESTONES.map((m) => {
                      const isReached = goal.milestonesReached.includes(m) || pace.progressPercent >= m;
                      return (
                        <span
                          key={m}
                          className={`flex items-center gap-0.5 ${
                            isReached
                              ? "text-[var(--jade-ink)] font-bold"
                              : "text-[var(--color-ink-faint)]"
                          }`}
                        >
                          {isReached ? "✓" : "○"} {m}%
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Smart Pace Information */}
                <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)]/70 p-3 text-xs">
                  {pace.status === "completed" ? (
                    <div className="flex items-center gap-2 text-[var(--jade-ink)] font-semibold">
                      <Sparkle size={16} weight="fill" className="text-[var(--amber)]" />
                      <span>{t("savings.completed")}</span>
                    </div>
                  ) : pace.status === "no_deadline" ? (
                    <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
                      <span>{t("savings.noDeadline")}</span>
                      <span className="font-mono text-xs">
                        ฿{thb.format(pace.remainingAmount)} {t("savings.remainingSuffix")}
                      </span>
                    </div>
                  ) : pace.status === "overdue" ? (
                    <div className="flex items-center justify-between text-[var(--rose)]">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <WarningCircle size={15} weight="fill" />
                        {t("savings.overdue")}
                      </span>
                      <span className="font-mono">
                        ฿{thb.format(pace.remainingAmount)} {t("savings.neededSuffix")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-ink-soft)] flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[var(--jade)] animate-pulse" />
                        {t("savings.onTrack")} · {t("savings.daysRemaining", { days: pace.daysRemaining })}
                      </span>
                      <div className="text-right font-mono">
                        <span className="font-bold text-[var(--color-ink)] block">
                          ฿{thb.format(pace.requiredPerMonth)} / mo
                        </span>
                        {pace.requiredPerDay > 0 && (
                          <span className="text-xs text-[var(--color-ink-soft)] font-normal">
                            (~฿{thb.format(pace.requiredPerDay)} / day)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Deposit & Withdraw */}
              <div className="mt-5 pt-3 border-t border-[var(--color-line)] flex items-center gap-2">
                <TactileButton
                  onClick={() => {
                    setDepositModalGoal(goal);
                    setDepositAmount(1000);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--jade-soft)] border border-[var(--jade)]/30 px-3 py-2 text-xs font-bold text-[var(--jade-ink)] shadow-xs hover:bg-[var(--jade-soft)]/80"
                >
                  <ArrowDown size={14} weight="bold" />
                  <span>{t("savings.deposit")}</span>
                  <span className="font-mono text-xs text-[var(--jade-ink)] opacity-75">
                    (+15 XP)
                  </span>
                </TactileButton>

                <TactileButton
                  onClick={() => {
                    setWithdrawModalGoal(goal);
                    setWithdrawAmount(Math.min(1000, goal.currentAmount));
                  }}
                  disabled={goal.currentAmount <= 0}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-ink-soft)] shadow-xs hover:bg-[var(--color-surface-subtle)] disabled:opacity-40"
                >
                  <ArrowUp size={14} weight="bold" />
                  <span>{t("savings.withdraw")}</span>
                </TactileButton>
              </div>
            </BentoCard>
          );
        })}
      </div>

      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {depositModalGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-diffuse)] overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
                <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <ArrowDown size={18} className="text-[var(--jade)]" weight="bold" />
                  {t("savings.depositTitle", { title: depositModalGoal.title })}
                </h3>
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] active:scale-[0.98] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    {t("savings.amountLabel")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-base font-bold text-[var(--color-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--jade)]/40"
                  />
                  {/* Quick Chips */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[500, 1000, 2000, 5000].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setDepositAmount(chip)}
                        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 font-mono text-xs text-[var(--color-ink-soft)] hover:bg-[var(--jade-soft)] hover:text-[var(--jade-ink)] active:scale-[0.98] transition"
                      >
                        +฿{thb.format(chip)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    {t("savings.noteLabel")}
                  </label>
                  <input
                    type="text"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    placeholder={t("savings.notePlaceholderDeposit")}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--jade)]/40"
                  />
                </div>

                <div className="rounded-xl border border-[var(--jade)]/20 bg-[var(--jade-soft)]/30 p-3 text-xs text-[var(--jade-ink)] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkle size={16} weight="fill" />
                    <span>{t("savings.rewardXpLabel")}</span>
                  </span>
                  <span className="font-mono font-bold">+{XP_PER_SAVINGS_DEPOSIT} XP</span>
                </div>

                <div className="text-xs text-[var(--color-ink-faint)] flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-[var(--jade)]" weight="fill" />
                  <span>{t("savings.syncLedger")}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <TactileButton
                  onClick={() => setDepositModalGoal(null)}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                >
                  {t("savings.cancel")}
                </TactileButton>
                <TactileButton
                  onClick={handleSubmitDeposit}
                  disabled={depositAmount <= 0}
                  className="rounded-xl bg-[#1C5954] px-4 py-2 text-xs font-bold text-[#FEFFFC] shadow-sm hover:brightness-110 dark:bg-[#76AA9D] dark:text-[#071B1A]"
                >
                  {t("savings.confirmDeposit", { xp: XP_PER_SAVINGS_DEPOSIT })}
                </TactileButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
        {withdrawModalGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-diffuse)] overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
                <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <ArrowUp size={18} className="text-[var(--amber)]" weight="bold" />
                  {t("savings.withdrawTitle", { title: withdrawModalGoal.title })}
                </h3>
                <button
                  type="button"
                  onClick={() => setWithdrawModalGoal(null)}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] active:scale-[0.98] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[var(--color-ink-soft)]">
                      {t("savings.amountLabel")}
                    </label>
                    <span className="font-mono text-xs text-[var(--color-ink-faint)]">
                      {t("savings.maxLabel", { amount: thb.format(withdrawModalGoal.currentAmount) })}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={withdrawModalGoal.currentAmount}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-base font-bold text-[var(--color-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--amber)]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    {t("savings.noteLabel")}
                  </label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    placeholder={t("savings.notePlaceholderWithdraw")}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <TactileButton
                  onClick={() => setWithdrawModalGoal(null)}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                >
                  {t("savings.cancel")}
                </TactileButton>
                <TactileButton
                  onClick={handleSubmitWithdraw}
                  disabled={withdrawAmount <= 0 || withdrawAmount > withdrawModalGoal.currentAmount}
                  className="rounded-xl bg-[var(--amber-ink)] px-4 py-2 text-xs font-bold text-[#FEFFFC] shadow-sm hover:brightness-110"
                >
                  {t("savings.confirmWithdraw")}
                </TactileButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOAL CREATE / EDIT MODAL */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-diffuse)] overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
                <h3 className="text-base font-bold text-[var(--color-ink)]">
                  {editingGoal ? t("savings.editModalTitle") : t("savings.createModalTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] active:scale-[0.98] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    {t("savings.goalTitleLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t("savings.goalTitlePlaceholder")}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--jade)]/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                      {t("savings.categoryLabel")}
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as SavingsGoalCategory)}
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden"
                    >
                      <option value="emergency">{t("savings.categories.emergency")}</option>
                      <option value="purchase">{t("savings.categories.purchase")}</option>
                      <option value="travel">{t("savings.categories.travel")}</option>
                      <option value="investment">{t("savings.categories.investment")}</option>
                      <option value="general">{t("savings.categories.general")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                      {t("savings.iconLabel")}
                    </label>
                    <select
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden"
                    >
                      <option value="ShieldCheck">{t("savings.icons.ShieldCheck")}</option>
                      <option value="AirplaneTilt">{t("savings.icons.AirplaneTilt")}</option>
                      <option value="Laptop">{t("savings.icons.Laptop")}</option>
                      <option value="House">{t("savings.icons.House")}</option>
                      <option value="Car">{t("savings.icons.Car")}</option>
                      <option value="Gift">{t("savings.icons.Gift")}</option>
                      <option value="GraduationCap">{t("savings.icons.GraduationCap")}</option>
                      <option value="PiggyBank">{t("savings.icons.PiggyBank")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    {t("savings.targetAmountLabel")}
                  </label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2 font-mono text-sm font-bold text-[var(--color-ink)] focus:outline-hidden focus:ring-2 focus:ring-[var(--jade)]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                    {t("savings.targetDateLabel")}
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3.5 py-2 text-xs text-[var(--color-ink)] focus:outline-hidden"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-line)]">
                  <TactileButton
                    type="button"
                    onClick={() => setIsGoalModalOpen(false)}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                  >
                    {t("savings.cancel")}
                  </TactileButton>
                  <TactileButton
                    type="submit"
                    className="rounded-xl bg-[#1C5954] px-4 py-2 text-xs font-bold text-[#FEFFFC] shadow-sm hover:brightness-110 dark:bg-[#76AA9D] dark:text-[#071B1A]"
                  >
                    {t("savings.save")}
                  </TactileButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMERGENCY FUND CALCULATOR MODAL */}
      <AnimatePresence>
        {isEmergencyCalcOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-diffuse)] overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-line)]">
                <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[var(--jade)]" weight="fill" />
                  {t("savings.emergencyModal.title")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEmergencyCalcOpen(false)}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] active:scale-[0.98] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-[var(--color-ink-soft)]">
                  {t("savings.emergencyModal.desc")}
                </p>

                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] p-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    {t("savings.emergencyModal.monthlySpending")}:
                  </span>
                  <span className="font-mono text-sm font-black text-[var(--color-ink)]">
                    ฿{thb.format(monthlyExpenseEstimate)}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--color-ink-soft)]">
                    {t("savings.safetyDurationLabel")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEmergencyMonths(3)}
                      className={`p-3 rounded-xl border text-left active:scale-[0.98] transition ${
                        emergencyMonths === 3
                          ? "border-[var(--jade)] bg-[var(--jade-soft)] text-[var(--jade-ink)]"
                          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
                      }`}
                    >
                      <div className="text-xs font-bold">{t("savings.emergencyModal.multiplier3")}</div>
                      <div className="mt-1 font-mono text-sm font-black">
                        ฿{thb.format(calculateEmergencyFundTarget(monthlyExpenseEstimate, 3))}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmergencyMonths(6)}
                      className={`p-3 rounded-xl border text-left active:scale-[0.98] transition ${
                        emergencyMonths === 6
                          ? "border-[var(--jade)] bg-[var(--jade-soft)] text-[var(--jade-ink)]"
                          : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)]"
                      }`}
                    >
                      <div className="text-xs font-bold">{t("savings.emergencyModal.multiplier6")}</div>
                      <div className="mt-1 font-mono text-sm font-black">
                        ฿{thb.format(calculateEmergencyFundTarget(monthlyExpenseEstimate, 6))}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--jade)]/30 bg-[var(--jade-soft)]/30 p-4">
                  <span className="text-xs font-semibold text-[var(--jade-ink)] block">
                    {t("savings.emergencyModal.recommendedTarget")}:
                  </span>
                  <span className="font-mono text-2xl font-black text-[var(--jade-ink)] block mt-1">
                    ฿{thb.format(emergencyTargetCalculated)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <TactileButton
                  onClick={() => setIsEmergencyCalcOpen(false)}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
                >
                  {t("savings.cancel")}
                </TactileButton>
                <TactileButton
                  onClick={handleApplyEmergencyFund}
                  className="rounded-xl bg-[#1C5954] px-4 py-2 text-xs font-bold text-[#FEFFFC] shadow-sm hover:brightness-110 dark:bg-[#76AA9D] dark:text-[#071B1A]"
                >
                  {t("savings.emergencyModal.applyButton")}
                </TactileButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
