import React from "react";
import {
  Book1,
  Bus,
  Cake,
  Calculator,
  Car,
  Card,
  Coffee,
  Coin,
  Cup,
  Diamonds,
  Drop,
  Driving,
  Edit2,
  Flash,
  Game,
  GasStation,
  Gift,
  Happyemoji,
  Health,
  Home,
  MessageQuestion,
  Milk,
  Mobile,
  Moneys,
  Monitor,
  Note,
  Pet,
  Receipt,
  Reserve,
  Setting4,
  ShieldTick,
  ShoppingBag,
  ShoppingCart,
  StatusUp,
  Strongbox,
  Tag,
  TaskSquare,
  Teacher,
  TickCircle,
  VideoPlay,
  Wallet,
  WalletCheck,
  Weight,
  Wifi,
  Airplane,
} from "iconsax-react";
import { fromIconsax, type AppIconComponent, type IconProps } from "./index";
import { FireGlyph, ShirtGlyph } from "./glyphs";

/**
 * Icons that are stored as data (presets, categories, savings goals, achievements) are saved as these
 * library-free keys. Older data holds emoji or Phosphor component names; `resolveIconKey` maps them here.
 */
export const ICONS = {
  coffee: fromIconsax(Coffee, "coffee"),
  meal: fromIconsax(Reserve, "meal"),
  drink: fromIconsax(Milk, "drink"),
  snack: fromIconsax(Cake, "snack"),
  groceries: fromIconsax(ShoppingCart, "groceries"),
  shopping: fromIconsax(ShoppingBag, "shopping"),
  clothing: fromIconsax(ShirtGlyph, "clothing"),
  transit: fromIconsax(Bus, "transit"),
  car: fromIconsax(Car, "car"),
  ride: fromIconsax(Driving, "ride"),
  fuel: fromIconsax(GasStation, "fuel"),
  airplane: fromIconsax(Airplane, "airplane"),
  home: fromIconsax(Home, "home"),
  utilities: fromIconsax(Flash, "utilities"),
  wifi: fromIconsax(Wifi, "wifi"),
  mobile: fromIconsax(Mobile, "mobile"),
  receipt: fromIconsax(Receipt, "receipt"),
  health: fromIconsax(Health, "health"),
  fitness: fromIconsax(Weight, "fitness"),
  "personal-care": fromIconsax(Drop, "personal-care"),
  learning: fromIconsax(Book1, "learning"),
  education: fromIconsax(Teacher, "education"),
  game: fromIconsax(Game, "game"),
  movie: fromIconsax(VideoPlay, "movie"),
  pet: fromIconsax(Pet, "pet"),
  baby: fromIconsax(Happyemoji, "baby"),
  gift: fromIconsax(Gift, "gift"),
  card: fromIconsax(Card, "card"),
  money: fromIconsax(Moneys, "money"),
  coins: fromIconsax(Coin, "coins"),
  wallet: fromIconsax(Wallet, "wallet"),
  savings: fromIconsax(Strongbox, "savings"),
  shield: fromIconsax(ShieldTick, "shield"),
  device: fromIconsax(Monitor, "device"),
  premium: fromIconsax(Diamonds, "premium"),
  tools: fromIconsax(Setting4, "tools"),
  tag: fromIconsax(Tag, "tag"),
  note: fromIconsax(Note, "note"),
  question: fromIconsax(MessageQuestion, "question"),
  // Achievement-only keys
  edit: fromIconsax(Edit2, "edit"),
  streak: fromIconsax(FireGlyph, "streak"),
  check: fromIconsax(TickCircle, "check"),
  balance: fromIconsax(WalletCheck, "balance"),
  tasks: fromIconsax(TaskSquare, "tasks"),
  calculator: fromIconsax(Calculator, "calculator"),
  growth: fromIconsax(StatusUp, "growth"),
  trophy: fromIconsax(Cup, "trophy"),
} satisfies Record<string, AppIconComponent>;

export type IconKey = keyof typeof ICONS;

/** Shared picker for presets and categories. */
export const PICKER_ICON_KEYS: readonly IconKey[] = [
  "coffee", "meal", "drink", "snack", "groceries", "shopping", "clothing", "transit",
  "car", "ride", "fuel", "airplane", "home", "utilities", "wifi", "mobile",
  "receipt", "health", "fitness", "personal-care", "learning", "education", "game", "movie",
  "pet", "baby", "gift", "card", "money", "coins", "wallet", "savings",
  "shield", "device", "premium", "tools", "tag",
];

export const SAVINGS_GOAL_ICON_KEYS: readonly IconKey[] = [
  "shield", "airplane", "device", "home", "car", "gift", "education", "savings",
];

const LEGACY_ALIASES: Record<string, IconKey> = {
  // Preset emoji
  "☕": "coffee", "🍱": "meal", "🍜": "meal", "🍔": "meal", "🥤": "drink", "🍰": "snack", "🍿": "snack",
  "🚇": "transit", "⛽": "fuel", "🛵": "ride", "🛒": "groceries", "🛍️": "shopping", "🛍": "shopping",
  "💊": "health", "🏋️": "fitness", "🏋": "fitness", "🧴": "personal-care", "⚡": "utilities", "🏠": "home",
  "📚": "learning", "🎮": "game", "🎬": "movie", "💳": "card", "💎": "premium", "💰": "money",
  "🐕": "pet", "📝": "note",
  // Phosphor component names (categories, savings goals, achievements)
  Coins: "coins", ForkKnife: "meal", Bus: "transit", House: "home", Heartbeat: "health",
  BookOpen: "learning", GameController: "game", CreditCard: "card", PiggyBank: "savings",
  ShoppingBag: "shopping", Coffee: "coffee", TShirt: "clothing", Gift: "gift", PawPrint: "pet",
  Baby: "baby", Airplane: "airplane", AirplaneTilt: "airplane", DeviceMobile: "mobile",
  Barbell: "fitness", FilmSlate: "movie", Wrench: "tools", Car: "car", Question: "question",
  Tag: "tag", ShieldCheck: "shield", Laptop: "device", GraduationCap: "education",
  PencilSimpleLine: "edit", Fire: "streak", FireSimple: "streak", CheckCircle: "check",
  Scales: "balance", ListChecks: "tasks", Calculator: "calculator", ChartLineUp: "growth",
  Trophy: "trophy",
};

export function isIconKey(value: unknown): value is IconKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ICONS, value);
}

/** Maps a stored icon value (new key, legacy emoji or legacy Phosphor name) to a key, or null if unknown. */
export function resolveIconKey(value: string | null | undefined): IconKey | null {
  if (!value) return null;
  if (isIconKey(value)) return value;
  return LEGACY_ALIASES[value] ?? LEGACY_ALIASES[value.replace(/️/g, "")] ?? null;
}

/** Like `resolveIconKey`, but always returns a key so the value can be saved back. */
export function normalizeIconKey(value: string | null | undefined, fallback: IconKey = "tag"): IconKey {
  return resolveIconKey(value) ?? fallback;
}

/**
 * Renders a stored icon value. Unknown values that are not plain names (e.g. an emoji a user
 * entered long ago) are shown as text so nothing silently disappears.
 */
export const AppIcon: React.FC<IconProps & { name: string | null | undefined; fallback?: IconKey }> = ({
  name,
  fallback = "tag",
  ...props
}) => {
  const key = resolveIconKey(name);
  if (!key && name && !/^[A-Za-z-]+$/.test(name)) {
    return (
      <span aria-hidden className={props.className} style={{ fontSize: props.size, lineHeight: 1 }}>
        {name}
      </span>
    );
  }
  const Icon = ICONS[key ?? fallback];
  return <Icon {...props} />;
};
