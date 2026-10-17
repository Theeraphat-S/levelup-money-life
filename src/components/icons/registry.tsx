import React from "react";
import {
  Book1,
  Bus,
  Cake,
  Car,
  Card,
  Coffee,
  Coin,
  Diamonds,
  Drop,
  Driving,
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
  Strongbox,
  Tag,
  Teacher,
  VideoPlay,
  Wallet,
  Weight,
  Wifi,
  Airplane,
} from "iconsax-react";
import { fromIconsax, type AppIconComponent, type IconProps } from "./index";
import { resolveIconKey, type IconKey } from "../../utils/iconKeys";

export { ICON_KEYS, PICKER_ICON_KEYS, SAVINGS_GOAL_ICON_KEYS, isIconKey, normalizeIconKey, resolveIconKey, type IconKey } from "../../utils/iconKeys";
import { ShirtGlyph } from "./glyphs";

/**
 * Icons that are stored as data (presets, categories, savings goals, achievements) are saved as these
 * library-free keys. Older data holds emoji or Phosphor component names; `resolveIconKey` maps them here.
 */
export const ICONS: Record<IconKey, AppIconComponent> = {
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
};

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
