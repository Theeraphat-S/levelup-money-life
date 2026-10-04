import { useState, useCallback, useRef } from "react";
import { saveAllTransactions } from "../services/db";
import { DEFAULT_PRESETS, saveStoredPresets } from "../utils/presetManager";
import type { PresetItem, Transaction } from "../types";

export function useTransactions() {
  const [transactions, setTransactionsState] = useState<Transaction[]>([]);
  const [presets, setPresetsState] = useState<PresetItem[]>(DEFAULT_PRESETS);
  const [lastLoggedTx, setLastLoggedTx] = useState<Transaction | null>(null);
  const transactionsRef = useRef<Transaction[]>([]);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const persistTransactions = useCallback((next: Transaction[]) => {
    transactionsRef.current = next;
    setTransactionsState(next);
    setSaveStatus("saving");
    const pending = writeQueue.current.catch(() => {}).then(() => saveAllTransactions(next));
    writeQueue.current = pending;
    pending.then(() => {
      if (writeQueue.current === pending) setSaveStatus("saved");
    }, () => { if (writeQueue.current === pending) setSaveStatus("failed"); });
    return pending;
  }, []);

  const setTransactions = useCallback(
    (value: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
      const next = typeof value === "function" ? value(transactionsRef.current) : value;
      // Keep an unsaved working copy available for retry; never silently discard edits.
      void persistTransactions(next).catch(() => {});
    },
    [persistTransactions]
  );

  const setPresets = useCallback(
    (value: PresetItem[] | ((prev: PresetItem[]) => PresetItem[])) => {
      setPresetsState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        saveStoredPresets(next).catch(console.error);
        return next;
      });
    },
    []
  );

  const logQuickTransaction = useCallback(
    (
      newTx: Transaction,
      hooks?: {
        onAwardXp?: (xp: number) => void;
        onAfterLogged?: (newTx: Transaction) => void;
      }
    ) => {
      return persistTransactions([newTx, ...transactionsRef.current.filter(tx => tx.id !== newTx.id)]).then(() => {
        setLastLoggedTx(newTx);
        if (hooks?.onAwardXp) {
          hooks.onAwardXp(15);
        }
        if (hooks?.onAfterLogged) {
          hooks.onAfterLogged(newTx);
        }
      });
    },
    [persistTransactions]
  );

  const undoTransaction = useCallback(
    async (
      tx: Transaction,
      hooks?: {
        onDeductXp?: (xp: number) => void;
        onToast?: (message: string) => void;
        undoNoticeMessage?: string;
      }
    ) => {
      await persistTransactions(transactionsRef.current.filter(item => item.id !== tx.id));
      setLastLoggedTx(null);
      if (hooks?.onDeductXp) {
        hooks.onDeductXp(15);
      }
      if (hooks?.onToast && hooks?.undoNoticeMessage) {
        hooks.onToast(hooks.undoNoticeMessage);
      }
    },
    [persistTransactions]
  );

  // Alias for semantic clarity when saving from QuickAddModal
  const saveQuickTransaction = logQuickTransaction;

  const saveSlipTransaction = useCallback(
    async (
      newTx: Transaction,
      xpBonus = 25,
      hooks?: {
        onAwardXp?: (xp: number) => void;
        onAfterLogged?: (newTx: Transaction) => void;
        onToast?: (message: string) => void;
        toastMessage?: string;
      }
    ) => {
      await persistTransactions([newTx, ...transactionsRef.current.filter(tx => tx.id !== newTx.id)]);
      if (hooks?.onAwardXp) {
        hooks.onAwardXp(xpBonus);
      }
      if (hooks?.onAfterLogged) {
        hooks.onAfterLogged(newTx);
      }
      if (hooks?.onToast && hooks?.toastMessage) {
        hooks.onToast(hooks.toastMessage);
      }
    },
    [persistTransactions]
  );

  const saveBatchSlipTransactions = useCallback(
    async (
      newTxs: Transaction[],
      totalXpBonus: number,
      hooks?: {
        onAwardXp?: (xp: number) => void;
        onAfterLoggedBatch?: (newTxs: Transaction[]) => void;
        onToast?: (message: string) => void;
        toastMessage?: string;
      }
    ) => {
      if (!newTxs || newTxs.length === 0) return;
      await persistTransactions([...newTxs, ...transactionsRef.current.filter(tx => !newTxs.some(next => next.id === tx.id))]);
      if (hooks?.onAwardXp) {
        hooks.onAwardXp(totalXpBonus);
      }
      if (hooks?.onAfterLoggedBatch) {
        hooks.onAfterLoggedBatch(newTxs);
      }
      if (hooks?.onToast && hooks?.toastMessage) {
        hooks.onToast(hooks.toastMessage);
      }
    },
    [persistTransactions]
  );

  const importTransactions = useCallback(
    async (
      imported: Transaction[],
      hooks?: {
        onAwardXp?: (xp: number) => void;
      }
    ) => {
      await persistTransactions([...imported, ...transactionsRef.current]);
      if (hooks?.onAwardXp) {
        hooks.onAwardXp(imported.length * 10);
      }
    },
    [persistTransactions]
  );

  const initTransactions = useCallback(
    (initialTxs: Transaction[], initialPresets: PresetItem[]) => {
      transactionsRef.current = initialTxs;
      setTransactionsState(initialTxs);
      setPresetsState(initialPresets);
    },
    []
  );

  return {
    transactions,
    saveStatus,
    retrySave: () => persistTransactions(transactionsRef.current),
    setTransactions,
    setTransactionsState: (txs: Transaction[]) => { transactionsRef.current = txs; setTransactionsState(txs); },
    presets,
    setPresets,
    setPresetsState,
    lastLoggedTx,
    setLastLoggedTx,
    logQuickTransaction,
    undoTransaction,
    saveQuickTransaction,
    saveSlipTransaction,
    saveBatchSlipTransactions,
    importTransactions,
    initTransactions,
  };
}
