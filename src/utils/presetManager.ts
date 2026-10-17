import type { AutocompleteItem, PresetItem, Transaction, TransactionCategory } from "../types";
import { getSetting, saveSetting } from "../services/db";
import { normalizeIconKey } from "./iconKeys";
import { BUILT_IN_CATEGORIES } from "./categories";

export const DEFAULT_PRESETS: PresetItem[] = [
  {
    id: "preset-coffee",
    icon: "coffee",
    name: "กาแฟ",
    amount: 60,
    category: "Food",
    type: "expense",
    usageCount: 15,
  },
  {
    id: "preset-lunch",
    icon: "meal",
    name: "ข้าวกลางวัน",
    amount: 70,
    category: "Food",
    type: "expense",
    usageCount: 12,
  },
  {
    id: "preset-transit",
    icon: "transit",
    name: "เดินทาง BTS/MRT",
    amount: 45,
    category: "Transport",
    type: "expense",
    usageCount: 10,
  },
  {
    id: "preset-7eleven",
    icon: "groceries",
    name: "7-Eleven",
    amount: 100,
    category: "Food",
    type: "expense",
    usageCount: 8,
  },
  {
    id: "preset-fuel",
    icon: "fuel",
    name: "เติมน้ำมัน",
    amount: 500,
    category: "Transport",
    type: "expense",
    usageCount: 6,
  },
  {
    id: "preset-milktea",
    icon: "drink",
    name: "ชานมไข่มุก",
    amount: 50,
    category: "Food",
    type: "expense",
    usageCount: 4,
  },
];

/** Icon a preset gets when it is auto-created from a category; same icons the categories use. */
export const CATEGORY_DEFAULT_ICONS: Record<string, string> = Object.fromEntries(
  BUILT_IN_CATEGORIES.map((c) => [c.id, c.icon]),
);

/**
 * Load presets from persistent storage or return defaults
 */
export async function getStoredPresets(): Promise<PresetItem[]> {
  let stored: unknown;
  try {
    stored = await getSetting<PresetItem[]>("presets", DEFAULT_PRESETS);
  } catch {
    try {
      const local = localStorage.getItem("levelup.presets");
      stored = local ? JSON.parse(local) : DEFAULT_PRESETS;
    } catch {
      stored = DEFAULT_PRESETS;
    }
  }
  const presets = Array.isArray(stored) ? (stored as PresetItem[]) : DEFAULT_PRESETS;
  // Presets saved before icon keys hold emoji; convert them and write the result back once.
  const migrated = presets.map((p) => ({ ...p, icon: normalizeIconKey(p.icon, "note") }));
  if (migrated.some((p, i) => p.icon !== presets[i].icon)) void saveStoredPresets(migrated);
  return migrated;
}

/**
 * Save presets to persistent storage
 */
export async function saveStoredPresets(presets: PresetItem[]): Promise<void> {
  localStorage.setItem("levelup.presets", JSON.stringify(presets));
  try {
    await saveSetting("presets", presets);
  } catch (err) {
    console.error("Failed to save presets to db:", err);
  }
}

/**
 * Add a new custom preset
 */
export function addPreset(
  newPreset: Omit<PresetItem, "id">,
  currentPresets: PresetItem[]
): PresetItem[] {
  const item: PresetItem = {
    ...newPreset,
    id: `custom-preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    usageCount: 1,
    isCustom: true,
  };
  return [...currentPresets, item];
}

/**
 * Update an existing preset
 */
export function updatePreset(
  updated: PresetItem,
  currentPresets: PresetItem[]
): PresetItem[] {
  return currentPresets.map((p) => (p.id === updated.id ? updated : p));
}

/**
 * Delete a preset by id
 */
export function deletePreset(
  id: string,
  currentPresets: PresetItem[]
): PresetItem[] {
  return currentPresets.filter((p) => p.id !== id);
}

/**
 * Increment usage counter for a preset when tapped
 */
export function incrementPresetUsage(
  id: string,
  currentPresets: PresetItem[]
): PresetItem[] {
  return currentPresets.map((p) => {
    if (p.id === id) {
      return { ...p, usageCount: (p.usageCount || 0) + 1 };
    }
    return p;
  });
}

/**
 * Auto-suggest top presets dynamically, merging custom/saved presets with frequently logged ledger items
 */
export function getSmartSuggestedPresets(
  transactions: Transaction[],
  presets: PresetItem[],
  limit = 8
): PresetItem[] {
  // 1. Analyze historical transactions to find high frequency patterns (same name & amount & type)
  const historyCounts: Record<
    string,
    { count: number; name: string; amount: number; category: TransactionCategory; isIncome: boolean }
  > = {};

  transactions.forEach((tx) => {
    if (!tx.name || !tx.amount) return;
    const isInc = tx.amount > 0 || tx.category === "Income";
    const key = `${tx.name.trim().toLowerCase()}_${Math.abs(tx.amount)}_${isInc ? "in" : "ex"}`;
    if (!historyCounts[key]) {
      historyCounts[key] = {
        count: 0,
        name: tx.name.trim(),
        amount: Math.abs(tx.amount),
        category: tx.category,
        isIncome: isInc,
      };
    }
    historyCounts[key].count += 1;
  });

  // 2. Identify frequent items logged at least twice that are not already in presets
  const presetKeys = new Set(
    presets.map(
      (p) =>
        `${p.name.trim().toLowerCase()}_${Math.abs(p.amount)}_${
          p.type === "income" || p.category === "Income" ? "in" : "ex"
        }`
    )
  );

  const autoGeneratedFromHistory: PresetItem[] = Object.entries(historyCounts)
    .filter(([key, item]) => item.count >= 2 && !presetKeys.has(key))
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([key, item]) => ({
      id: `auto-history-${key.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")}`,
      icon: CATEGORY_DEFAULT_ICONS[item.category] || "utilities",
      name: item.name,
      amount: item.amount,
      category: item.category,
      type: item.isIncome ? "income" : "expense",
      usageCount: item.count,
    }));

  // 3. Combine and sort by usage count
  const allCandidates = [...presets, ...autoGeneratedFromHistory].sort(
    (a, b) => (b.usageCount || 0) - (a.usageCount || 0)
  );

  return allCandidates.slice(0, limit);
}

/**
 * Live autocomplete suggestions from presets and past transaction history
 */
export function getAutocompleteSuggestions(
  query: string,
  transactions: Transaction[],
  presets: PresetItem[],
  limit = 6
): AutocompleteItem[] {
  const cleanQuery = query.trim().toLowerCase();

  const results: AutocompleteItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Match against Presets first
  presets.forEach((p) => {
    const isInc = p.type === "income" || p.category === "Income";
    const key = `${p.name.toLowerCase()}_${Math.abs(p.amount)}_${isInc ? "in" : "ex"}`;
    if (seenKeys.has(key)) return;

    if (
      !cleanQuery ||
      p.name.toLowerCase().includes(cleanQuery) ||
      String(p.amount).includes(cleanQuery)
    ) {
      seenKeys.add(key);
      results.push({
        id: `auto-preset-${p.id}`,
        name: p.name,
        amount: isInc ? Math.abs(p.amount) : -Math.abs(p.amount),
        category: p.category,
        type: isInc ? "income" : "expense",
        source: "preset",
        icon: p.icon,
        frequency: p.usageCount || 1,
      });
    }
  });

  // 2. Match against Transactions History
  const historyMap = new Map<
    string,
    { name: string; amount: number; category: TransactionCategory; count: number; isIncome: boolean }
  >();

  transactions.forEach((tx) => {
    if (!tx.name) return;
    const isInc = tx.amount > 0 || tx.category === "Income";
    const key = `${tx.name.trim().toLowerCase()}_${Math.abs(tx.amount)}_${isInc ? "in" : "ex"}`;
    const existing = historyMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      historyMap.set(key, {
        name: tx.name.trim(),
        amount: tx.amount,
        category: tx.category,
        count: 1,
        isIncome: isInc,
      });
    }
  });

  // Sort history by frequency
  const sortedHistory = Array.from(historyMap.entries()).sort(
    ([, a], [, b]) => b.count - a.count
  );

  sortedHistory.forEach(([key, h]) => {
    if (seenKeys.has(key)) return;

    if (
      !cleanQuery ||
      h.name.toLowerCase().includes(cleanQuery) ||
      String(Math.abs(h.amount)).includes(cleanQuery)
    ) {
      seenKeys.add(key);
      results.push({
        id: `auto-hist-${key.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, "_")}`,
        name: h.name,
        amount: h.amount,
        category: h.category,
        type: h.isIncome ? "income" : "expense",
        source: "history",
        icon: CATEGORY_DEFAULT_ICONS[h.category] || "note",
        frequency: h.count,
      });
    }
  });

  return results.slice(0, limit);
}
