import React, { forwardRef } from "react";
import {
  Add,
  Airplane as IsxAirplane,
  ArrangeHorizontal,
  Archive as IsxArchive,
  ArrowDown as IsxArrowDown,
  ArrowDown2,
  ArrowLeft2,
  ArrowRight as IsxArrowRight,
  ArrowRight2,
  ArrowRotateLeft,
  ArrowUp as IsxArrowUp,
  Bank as IsxBank,
  Book1,
  Buildings2,
  Bus as IsxBus,
  Calculator as IsxCalculator,
  Calendar,
  Calendar1,
  Car as IsxCar,
  Card,
  Chart,
  Chart21,
  Coffee as IsxCoffee,
  Coin,
  Command as IsxCommand,
  Danger,
  Data,
  DocumentCode,
  DocumentText,
  DollarCircle,
  Edit2,
  ExportCurve,
  Eye as IsxEye,
  EyeSlash as IsxEyeSlash,
  Filter,
  Flash,
  Game,
  Gift as IsxGift,
  Happyemoji,
  Health,
  Heart,
  Home,
  InfoCircle,
  Lamp,
  LampOn,
  Lock as IsxLock,
  MagicStar,
  Magicpen,
  MessageQuestion,
  Mobile,
  Money as IsxMoney,
  Monitor,
  Moon as IsxMoon,
  NotificationBing,
  Pet,
  Receipt as IsxReceipt,
  Refresh,
  Reserve,
  RotateLeft,
  SearchNormal1,
  Setting2,
  Setting4,
  ShieldTick,
  ShoppingBag as IsxShoppingBag,
  Star as IsxStar,
  StatusUp,
  Strongbox,
  Sun1,
  Tag as IsxTag,
  TaskSquare,
  Teacher,
  TickCircle,
  Trash as IsxTrash,
  Tree,
  TrendDown as IsxTrendDown,
  TrendUp as IsxTrendUp,
  Cup,
  Briefcase,
  Wallet as IsxWallet,
  WalletCheck,
  Warning2,
  Weight,
  Gps,
  VideoPlay,
  type Icon as IconsaxIcon,
  type IconProps as IconsaxProps,
} from "iconsax-react";
import { CheckGlyph, CircleGlyph, CrossGlyph, FireGlyph, ShirtGlyph } from "./glyphs";

/**
 * The app's static icon set (Iconsax). Call sites pick a `weight` that maps onto an Iconsax variant:
 * regular/bold → Linear, fill → Bold (active or emphasised), duotone → Bulk (decorative, two-tone).
 * Export names are the ones the components used before the move off Phosphor, so call sites stay as they were.
 */
export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";

export interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "color"> {
  size?: number | string;
  weight?: IconWeight;
  color?: string;
}

export type AppIconComponent = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

const VARIANT: Partial<Record<IconWeight, NonNullable<IconsaxProps["variant"]>>> = {
  fill: "Bold",
  duotone: "Bulk",
};

export function fromIconsax(Glyph: IconsaxIcon, name: string): AppIconComponent {
  // iconsax-react relies on defaultProps, which React 19 ignores for function components,
  // so size, colour and variant are always passed explicitly here.
  const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ size = "1em", weight = "regular", color = "currentColor", ...rest }, ref) => (
      <Glyph {...rest} ref={ref} size={size} color={color} variant={VARIANT[weight] ?? "Linear"} />
    ),
  );
  Icon.displayName = name;
  return Icon;
}

export const Airplane = fromIconsax(IsxAirplane, "Airplane");
export const AirplaneTilt = Airplane;
export const Archive = fromIconsax(IsxArchive, "Archive");
export const ArrowCounterClockwise = fromIconsax(RotateLeft, "ArrowCounterClockwise");
export const ArrowDown = fromIconsax(IsxArrowDown, "ArrowDown");
export const ArrowRight = fromIconsax(IsxArrowRight, "ArrowRight");
export const ArrowUp = fromIconsax(IsxArrowUp, "ArrowUp");
export const ArrowUUpLeft = fromIconsax(ArrowRotateLeft, "ArrowUUpLeft");
export const ArrowsClockwise = fromIconsax(Refresh, "ArrowsClockwise");
export const ArrowsLeftRight = fromIconsax(ArrangeHorizontal, "ArrowsLeftRight");
export const Baby = fromIconsax(Happyemoji, "Baby");
export const Bank = fromIconsax(IsxBank, "Bank");
export const Barbell = fromIconsax(Weight, "Barbell");
export const BellRinging = fromIconsax(NotificationBing, "BellRinging");
export const BookOpen = fromIconsax(Book1, "BookOpen");
export const Buildings = fromIconsax(Buildings2, "Buildings");
export const Bus = fromIconsax(IsxBus, "Bus");
export const Calculator = fromIconsax(IsxCalculator, "Calculator");
export const CalendarBlank = fromIconsax(Calendar1, "CalendarBlank");
export const CalendarDots = fromIconsax(Calendar, "CalendarDots");
export const Car = fromIconsax(IsxCar, "Car");
export const CaretDown = fromIconsax(ArrowDown2, "CaretDown");
export const CaretLeft = fromIconsax(ArrowLeft2, "CaretLeft");
export const CaretRight = fromIconsax(ArrowRight2, "CaretRight");
export const ChartBar = fromIconsax(Chart, "ChartBar");
export const ChartLineUp = fromIconsax(StatusUp, "ChartLineUp");
export const ChartPie = fromIconsax(Chart21, "ChartPie");
export const Check = fromIconsax(CheckGlyph, "Check");
export const CheckCircle = fromIconsax(TickCircle, "CheckCircle");
export const Circle = fromIconsax(CircleGlyph, "Circle");
export const Coffee = fromIconsax(IsxCoffee, "Coffee");
export const Coins = fromIconsax(Coin, "Coins");
export const Command = fromIconsax(IsxCommand, "Command");
export const CreditCard = fromIconsax(Card, "CreditCard");
export const CurrencyCircleDollar = fromIconsax(DollarCircle, "CurrencyCircleDollar");
export const Database = fromIconsax(Data, "Database");
export const Desktop = fromIconsax(Monitor, "Desktop");
export const DeviceMobile = fromIconsax(Mobile, "DeviceMobile");
export const Eye = fromIconsax(IsxEye, "Eye");
export const EyeSlash = fromIconsax(IsxEyeSlash, "EyeSlash");
export const FileCode = fromIconsax(DocumentCode, "FileCode");
export const FileCsv = fromIconsax(DocumentText, "FileCsv");
export const FilmSlate = fromIconsax(VideoPlay, "FilmSlate");
export const Fire = fromIconsax(FireGlyph, "Fire");
export const Flame = Fire;
export const ForkKnife = fromIconsax(Reserve, "ForkKnife");
export const Funnel = fromIconsax(Filter, "Funnel");
export const GameController = fromIconsax(Game, "GameController");
export const GearSix = fromIconsax(Setting2, "GearSix");
export const Gift = fromIconsax(IsxGift, "Gift");
export const GraduationCap = fromIconsax(Teacher, "GraduationCap");
export const HeartStraight = fromIconsax(Heart, "HeartStraight");
export const Heartbeat = fromIconsax(Health, "Heartbeat");
export const House = fromIconsax(Home, "House");
export const Info = fromIconsax(InfoCircle, "Info");
export const Laptop = fromIconsax(Monitor, "Laptop");
export const Lightbulb = fromIconsax(Lamp, "Lightbulb");
export const LightbulbFilament = fromIconsax(LampOn, "LightbulbFilament");
export const Lightning = fromIconsax(Flash, "Lightning");
export const ListChecks = fromIconsax(TaskSquare, "ListChecks");
export const Lock = fromIconsax(IsxLock, "Lock");
export const MagicWand = fromIconsax(Magicpen, "MagicWand");
export const MagnifyingGlass = fromIconsax(SearchNormal1, "MagnifyingGlass");
export const Money = fromIconsax(IsxMoney, "Money");
export const Moon = fromIconsax(IsxMoon, "Moon");
export const PawPrint = fromIconsax(Pet, "PawPrint");
export const PencilSimple = fromIconsax(Edit2, "PencilSimple");
export const PiggyBank = fromIconsax(Strongbox, "PiggyBank");
export const Plus = fromIconsax(Add, "Plus");
export const Question = fromIconsax(MessageQuestion, "Question");
export const Receipt = fromIconsax(IsxReceipt, "Receipt");
export const Scales = fromIconsax(WalletCheck, "Scales");
export const ShieldCheck = fromIconsax(ShieldTick, "ShieldCheck");
export const ShoppingBag = fromIconsax(IsxShoppingBag, "ShoppingBag");
export const Sparkle = fromIconsax(MagicStar, "Sparkle");
export const Star = fromIconsax(IsxStar, "Star");
export const Sun = fromIconsax(Sun1, "Sun");
export const TShirt = fromIconsax(ShirtGlyph, "TShirt");
export const Tag = fromIconsax(IsxTag, "Tag");
export const Target = fromIconsax(Gps, "Target");
export const Toolbox = fromIconsax(Briefcase, "Toolbox");
export const Trash = fromIconsax(IsxTrash, "Trash");
export const TreeEvergreen = fromIconsax(Tree, "TreeEvergreen");
export const TrendDown = fromIconsax(IsxTrendDown, "TrendDown");
export const TrendUp = fromIconsax(IsxTrendUp, "TrendUp");
export const Trophy = fromIconsax(Cup, "Trophy");
export const UploadSimple = fromIconsax(ExportCurve, "UploadSimple");
export const Wallet = fromIconsax(IsxWallet, "Wallet");
export const Warning = fromIconsax(Danger, "Warning");
export const WarningCircle = fromIconsax(Warning2, "WarningCircle");
export const Wrench = fromIconsax(Setting4, "Wrench");
export const X = fromIconsax(CrossGlyph, "X");
