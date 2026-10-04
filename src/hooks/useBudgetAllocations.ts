import { useState, useCallback } from "react";
import { getAllocations, saveAllocations, saveSetting } from "../services/db";
import type { Allocation } from "../types";

export function useBudgetAllocations() {
  const [allocations, setAllocationsState] = useState<Allocation[]>([]);
  const [income, setIncomeState] = useState<number>(0);

  const setAllocations = useCallback(
    (value: Allocation[] | ((prev: Allocation[]) => Allocation[])) => {
      setAllocationsState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        saveAllocations(next).catch(console.error);
        return next;
      });
    },
    []
  );

  const setIncome = useCallback((value: number | ((prev: number) => number)) => {
    setIncomeState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      saveSetting("income", next).catch(console.error);
      return next;
    });
  }, []);

  const initAllocations = useCallback((initialAllocs: Allocation[], initialIncome: number) => {
    setAllocationsState(initialAllocs);
    setIncomeState(initialIncome);
  }, []);

  return {
    allocations,
    setAllocations,
    setAllocationsState,
    income,
    setIncome,
    setIncomeState,
    initAllocations,
  };
}
