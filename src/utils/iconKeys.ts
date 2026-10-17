/**
 * Library-free icon keys for icons stored as data (presets, categories, savings goals).
 * This file is pure data so the data layer never has to import React or the icon library;
 * `components/icons/registry.tsx` maps each key to a component.
 */
export const ICON_KEYS = [
  "coffee", "meal", "drink", "snack", "groceries", "shopping", "clothing", "transit",
  "car", "ride", "fuel", "airplane", "home", "utilities", "wifi", "mobile",
  "receipt", "health", "fitness", "personal-care", "learning", "education", "game", "movie",
  "pet", "baby", "gift", "card", "money", "coins", "wallet", "savings",
  "shield", "device", "premium", "tools", "tag", "note", "question",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** Shared picker for presets and categories (everything except the fallbacks). */
export const PICKER_ICON_KEYS: readonly IconKey[] = ICON_KEYS.filter((k) => k !== "note" && k !== "question");

export const SAVINGS_GOAL_ICON_KEYS: readonly IconKey[] = [
  "shield", "airplane", "device", "home", "car", "gift", "education", "savings",
];

/** Older versions stored emoji (presets) or Phosphor component names (categories, goals). */
const LEGACY_ALIASES: Readonly<Record<string, IconKey>> = {
  "☕": "coffee", "🍱": "meal", "🍜": "meal", "🍔": "meal", "🥤": "drink", "🍰": "snack", "🍿": "snack",
  "🚇": "transit", "⛽": "fuel", "🛵": "ride", "🛒": "groceries", "🛍": "shopping",
  "💊": "health", "🏋": "fitness", "🧴": "personal-care", "⚡": "utilities", "🏠": "home",
  "📚": "learning", "🎮": "game", "🎬": "movie", "💳": "card", "💎": "premium", "💰": "money",
  "🐕": "pet", "📝": "note",
  Coins: "coins", ForkKnife: "meal", Bus: "transit", House: "home", Heartbeat: "health",
  BookOpen: "learning", GameController: "game", CreditCard: "card", PiggyBank: "savings",
  ShoppingBag: "shopping", Coffee: "coffee", TShirt: "clothing", Gift: "gift", PawPrint: "pet",
  Baby: "baby", Airplane: "airplane", AirplaneTilt: "airplane", DeviceMobile: "mobile",
  Barbell: "fitness", FilmSlate: "movie", Wrench: "tools", Car: "car", Question: "question",
  Tag: "tag", ShieldCheck: "shield", Laptop: "device", GraduationCap: "education",
};

const KEY_SET: ReadonlySet<string> = new Set(ICON_KEYS);
const VARIATION_SELECTOR = /️/g;

export function isIconKey(value: unknown): value is IconKey {
  return typeof value === "string" && KEY_SET.has(value);
}

function legacyAlias(value: string): IconKey | undefined {
  return Object.prototype.hasOwnProperty.call(LEGACY_ALIASES, value) ? LEGACY_ALIASES[value] : undefined;
}

/** Maps a stored value (new key, legacy emoji or legacy Phosphor name) to a key, or null if unknown. */
export function resolveIconKey(value: string | null | undefined): IconKey | null {
  if (!value) return null;
  if (isIconKey(value)) return value;
  return legacyAlias(value) ?? legacyAlias(value.replace(VARIATION_SELECTOR, "")) ?? null;
}

/** Like `resolveIconKey`, but always returns a key so the value can be saved back. */
export function normalizeIconKey(value: string | null | undefined, fallback: IconKey = "tag"): IconKey {
  return resolveIconKey(value) ?? fallback;
}
