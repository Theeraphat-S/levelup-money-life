import { useCallback, useRef, useState } from "react";
import { saveSetting } from "../services/db";
import type { Account, Transfer } from "../types";
import { DEFAULT_ACCOUNT_ID, normalizeAlias, resolveDefaultAccountId } from "../utils/accounts";

export function useAccounts() {
  const [accounts, setAccountsState] = useState<Account[]>([]);
  const [transfers, setTransfersState] = useState<Transfer[]>([]);
  const [defaultAccountId, setDefaultAccountIdState] = useState<string>(DEFAULT_ACCOUNT_ID);
  const accountsRef = useRef<Account[]>([]);
  const transfersRef = useRef<Transfer[]>([]);
  const defaultRef = useRef<string>(DEFAULT_ACCOUNT_ID);

  const persistAccounts = useCallback((next: Account[], preferredDefault?: string) => {
    accountsRef.current = next;
    setAccountsState(next);
    void saveSetting("accounts", next);
    const resolved = resolveDefaultAccountId(next, preferredDefault ?? defaultRef.current);
    if (resolved !== defaultRef.current || preferredDefault) void saveSetting("defaultAccountId", resolved);
    defaultRef.current = resolved;
    setDefaultAccountIdState(resolved);
  }, []);

  const persistTransfers = useCallback((next: Transfer[]) => {
    transfersRef.current = next;
    setTransfersState(next);
    void saveSetting("transfers", next);
  }, []);

  const initAccounts = useCallback((initial: Account[], initialTransfers: Transfer[], preferredDefault?: string) => {
    accountsRef.current = initial;
    transfersRef.current = initialTransfers;
    setAccountsState(initial);
    setTransfersState(initialTransfers);
    defaultRef.current = resolveDefaultAccountId(initial, preferredDefault);
    setDefaultAccountIdState(defaultRef.current);
  }, []);

  const saveAccount = useCallback((account: Account) => {
    const clean = { ...account, name: account.name.trim(), alias: normalizeAlias(account.alias) };
    const exists = accountsRef.current.some((a) => a.id === clean.id);
    persistAccounts(exists ? accountsRef.current.map((a) => (a.id === clean.id ? clean : a)) : [...accountsRef.current, clean]);
  }, [persistAccounts]);

  const setAccountArchived = useCallback((id: string, archived: boolean) => {
    const next = accountsRef.current.map((a) => (a.id === id ? { ...a, archived } : a));
    if (!next.some((a) => !a.archived)) return; // Always keep one active account
    persistAccounts(next);
  }, [persistAccounts]);

  // Callers must check the account is unreferenced first; referenced accounts are archived instead.
  const deleteAccount = useCallback((id: string) => {
    const next = accountsRef.current.filter((a) => a.id !== id);
    if (!next.some((a) => !a.archived)) return;
    persistAccounts(next);
  }, [persistAccounts]);

  const setDefaultAccountId = useCallback((id: string) => {
    persistAccounts(accountsRef.current, id);
  }, [persistAccounts]);

  const addTransfer = useCallback((transfer: Transfer) => {
    persistTransfers([transfer, ...transfersRef.current]);
  }, [persistTransfers]);

  const deleteTransfer = useCallback((id: string) => {
    persistTransfers(transfersRef.current.filter((t) => t.id !== id));
  }, [persistTransfers]);

  const replaceAll = useCallback((nextAccounts: Account[], nextTransfers: Transfer[]) => {
    persistAccounts(nextAccounts);
    persistTransfers(nextTransfers);
  }, [persistAccounts, persistTransfers]);

  return {
    accounts,
    transfers,
    defaultAccountId,
    initAccounts,
    saveAccount,
    setAccountArchived,
    deleteAccount,
    setDefaultAccountId,
    addTransfer,
    deleteTransfer,
    replaceAll,
  };
}
