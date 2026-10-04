import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { SavingsGoal, Transaction } from "../types";
import {
  getSavingsGoals,
  saveSavingsGoal,
  saveAllSavingsGoals,
  deleteSavingsGoal as dbDeleteSavingsGoal,
} from "../services/db";
import {
  checkGoalMilestones,
  XP_PER_SAVINGS_DEPOSIT,
} from "../utils/savingsGoals";

export type UseSavingsGoalsProps = {
  onAddTransaction?: (tx: Omit<Transaction, "id">) => void;
  onAwardXp?: (amount: number, reason?: string) => void;
};

export function useSavingsGoals(props?: UseSavingsGoalsProps) {
  const { onAddTransaction, onAwardXp } = props || {};
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load goals from DB
  const loadGoals = useCallback(async () => {
    try {
      const data = await getSavingsGoals();
      setGoals(data);
    } catch (err) {
      console.error("Failed to load savings goals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const goalsRef = useRef(goals);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  // Create new goal
  const createGoal = useCallback(
    async (
      data: Omit<
        SavingsGoal,
        "id" | "currentAmount" | "status" | "milestonesReached" | "createdAt" | "updatedAt"
      >
    ) => {
      const now = new Date().toISOString();
      const newGoal: SavingsGoal = {
        ...data,
        id: crypto.randomUUID(),
        currentAmount: 0,
        status: "active",
        milestonesReached: [],
        createdAt: now,
        updatedAt: now,
      };

      const next = [...goalsRef.current, newGoal];
      goalsRef.current = next;
      setGoals(next);
      await saveSavingsGoal(newGoal);
      return newGoal;
    },
    []
  );

  // Update existing goal
  const updateGoal = useCallback(async (updated: SavingsGoal) => {
    const withTimestamp = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    const next = goalsRef.current.map((g) => (g.id === updated.id ? withTimestamp : g));
    goalsRef.current = next;
    setGoals(next);
    await saveSavingsGoal(withTimestamp);
  }, []);

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string) => {
    const next = goalsRef.current.filter((g) => g.id !== goalId);
    goalsRef.current = next;
    setGoals(next);
    await dbDeleteSavingsGoal(goalId);
  }, []);

  // Deposit money into goal
  const depositToGoal = useCallback(
    async (goalId: string, amount: number, note?: string, txName?: string) => {
      const goal = goalsRef.current.find((g) => g.id === goalId);
      if (!goal || amount <= 0) return { newlyReachedMilestones: [], xpEarned: 0 };

      const prevAmount = goal.currentAmount;
      const newAmount = prevAmount + amount;
      const isCompleted = newAmount >= goal.targetAmount;

      const { newlyReached, xpEarned: totalBonusXp } = checkGoalMilestones(
        prevAmount,
        newAmount,
        goal.targetAmount,
        goal.milestonesReached || []
      );

      const totalXpEarned = XP_PER_SAVINGS_DEPOSIT + totalBonusXp;

      const updatedGoal: SavingsGoal = {
        ...goal,
        currentAmount: newAmount,
        status: isCompleted ? "completed" : "active",
        milestonesReached: [
          ...(goal.milestonesReached || []),
          ...newlyReached,
        ],
        updatedAt: new Date().toISOString(),
      };

      const next = goalsRef.current.map((g) => (g.id === goalId ? updatedGoal : g));
      goalsRef.current = next;
      setGoals(next);
      await saveSavingsGoal(updatedGoal);

      // Auto-sync into Ledger as 'Savings' expense (negative amount in Ledger)
      if (onAddTransaction) {
        const todayStr = new Date().toISOString().slice(0, 10);
        onAddTransaction({
          name: txName || `${goal.title}`,
          amount: -Math.abs(amount),
          date: todayStr,
          category: "Savings",
          cleared: true,
          notes: note || `Savings Goal deposit for "${goal.title}"`,
        });
      }

      // Total XP = Base deposit XP + Milestone bonus XP
      if (onAwardXp && totalXpEarned > 0) {
        onAwardXp(totalXpEarned, `Deposit to ${goal.title}`);
      }

      return {
        newlyReachedMilestones: newlyReached,
        xpEarned: totalXpEarned,
      };
    },
    [onAddTransaction, onAwardXp]
  );

  // Withdraw money from goal
  const withdrawFromGoal = useCallback(
    async (goalId: string, amount: number, note?: string, txName?: string) => {
      const goal = goalsRef.current.find((g) => g.id === goalId);
      if (!goal || amount <= 0) return;

      const newAmount = Math.max(0, goal.currentAmount - amount);
      const isStillCompleted = newAmount >= goal.targetAmount;

      const updatedGoal: SavingsGoal = {
        ...goal,
        currentAmount: newAmount,
        status: isStillCompleted ? "completed" : "active",
        updatedAt: new Date().toISOString(),
      };

      const next = goalsRef.current.map((g) => (g.id === goalId ? updatedGoal : g));
      goalsRef.current = next;
      setGoals(next);
      await saveSavingsGoal(updatedGoal);

      // Auto-sync into Ledger as positive refund/withdrawal in Savings
      if (onAddTransaction) {
        const todayStr = new Date().toISOString().slice(0, 10);
        onAddTransaction({
          name: txName || `${goal.title}`,
          amount: Math.abs(amount),
          date: todayStr,
          category: "Savings",
          cleared: true,
          notes: note || `Savings Goal withdrawal from "${goal.title}"`,
        });
      }
    },
    [onAddTransaction]
  );

  // Set all goals (e.g. from JSON snapshot restore)
  const setAllGoals = useCallback(async (newGoals: SavingsGoal[]) => {
    setGoals(newGoals);
    await saveAllSavingsGoals(newGoals);
  }, []);

  // Aggregated metrics
  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [goals]);

  const totalTarget = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.targetAmount, 0);
  }, [goals]);

  const overallProgress = useMemo(() => {
    if (totalTarget <= 0) return 0;
    return Math.min(100, Math.round((totalSaved / totalTarget) * 100));
  }, [totalSaved, totalTarget]);

  const activeGoalsCount = useMemo(() => {
    return goals.filter((g) => g.status === "active").length;
  }, [goals]);

  const completedGoalsCount = useMemo(() => {
    return goals.filter((g) => g.status === "completed" || g.currentAmount >= g.targetAmount).length;
  }, [goals]);

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    withdrawFromGoal,
    setAllGoals,
    refreshGoals: loadGoals,
    totalSaved,
    totalTarget,
    overallProgress,
    activeGoalsCount,
    completedGoalsCount,
  };
}
