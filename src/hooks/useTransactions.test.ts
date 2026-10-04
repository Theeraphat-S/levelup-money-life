import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTransactions } from "./useTransactions";
import { saveAllTransactions } from "../services/db";
import type { Transaction } from "../types";

vi.mock("../services/db", () => ({
  saveAllTransactions: vi.fn().mockResolvedValue(undefined),
}));

describe("useTransactions hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log quick transaction and update lastLoggedTx after persistence", async () => {
    const { result } = renderHook(() => useTransactions());
    const onAwardXp = vi.fn();
    const onAfterLogged = vi.fn();

    const sampleTx: Transaction = {
      id: "tx-99",
      name: "Coffee",
      amount: -85,
      date: "2026-08-30",
      category: "Food",
      cleared: true,
    };

    await act(async () => {
      await result.current.logQuickTransaction(sampleTx, { onAwardXp, onAfterLogged });
    });

    expect(result.current.transactions.length).toBe(1);
    expect(result.current.transactions[0].id).toBe("tx-99");
    expect(result.current.lastLoggedTx).toEqual(sampleTx);
    expect(onAwardXp).toHaveBeenCalledWith(15);
    expect(onAfterLogged).toHaveBeenCalledWith(sampleTx);
  });

  it("should undo transaction and clear lastLoggedTx", async () => {
    const { result } = renderHook(() => useTransactions());
    const onDeductXp = vi.fn();

    const sampleTx: Transaction = {
      id: "tx-99",
      name: "Coffee",
      amount: -85,
      date: "2026-08-30",
      category: "Food",
      cleared: true,
    };

    await act(async () => {
      await result.current.logQuickTransaction(sampleTx);
    });

    expect(result.current.transactions.length).toBe(1);

    await act(async () => {
      await result.current.undoTransaction(sampleTx, { onDeductXp });
    });

    expect(result.current.transactions.length).toBe(0);
    expect(result.current.lastLoggedTx).toBeNull();
    expect(onDeductXp).toHaveBeenCalledWith(15);
  });

  it("retains failed draft without success rewards and retries the same id without duplication", async () => {
    vi.mocked(saveAllTransactions).mockRejectedValueOnce(new Error("Disk full"));
    const { result } = renderHook(() => useTransactions());
    const award = vi.fn();
    const tx: Transaction = { id: "retry", name: "Lunch", amount: -65.5, date: "2026-10-04", category: "Food", cleared: true };
    await act(async () => {
      await expect(result.current.logQuickTransaction(tx, { onAwardXp: award })).rejects.toThrow("Disk full");
    });
    expect(result.current.saveStatus).toBe("failed");
    expect(result.current.lastLoggedTx).toBeNull();
    expect(award).not.toHaveBeenCalled();
    expect(result.current.transactions).toEqual([tx]);
    await act(async () => {
      await result.current.logQuickTransaction({ ...tx, amount: -70 }, { onAwardXp: award });
    });
    expect(result.current.saveStatus).toBe("saved");
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].amount).toBe(-70);
    expect(award).toHaveBeenCalledTimes(1);
  });

  it("serializes rapid saves so an older snapshot cannot overwrite a newer entry", async () => {
    let release!: () => void;
    vi.mocked(saveAllTransactions).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const { result } = renderHook(() => useTransactions());
    const tx: Transaction = { id: "one", name: "Coffee", amount: -60, date: "2026-10-04", category: "Food", cleared: true };
    let first!: Promise<void>;
    let second!: Promise<void>;
    await act(async () => {
      first = result.current.logQuickTransaction(tx);
      second = result.current.logQuickTransaction({ ...tx, id: "two" });
      await Promise.resolve();
    });
    expect(saveAllTransactions).toHaveBeenCalledTimes(1);
    await act(async () => { release(); await Promise.all([first, second]); });
    expect(vi.mocked(saveAllTransactions).mock.calls[1][0].map(row => row.id)).toEqual(["two", "one"]);
  });
});
