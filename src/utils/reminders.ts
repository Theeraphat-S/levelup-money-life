import type { Transaction } from "../types";

export type DesktopSettings = {
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM", local time
  closeToTray: boolean;
  launchAtLogin: boolean;
};

export const DEFAULT_DESKTOP_SETTINGS: DesktopSettings = {
  reminderEnabled: true,
  reminderTime: "20:00",
  closeToTray: true,
  launchAtLogin: false,
};

export function sanitizeDesktopSettings(value: unknown): DesktopSettings {
  const v = (value ?? {}) as Partial<DesktopSettings>;
  return {
    reminderEnabled: typeof v.reminderEnabled === "boolean" ? v.reminderEnabled : DEFAULT_DESKTOP_SETTINGS.reminderEnabled,
    reminderTime: typeof v.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v.reminderTime) ? v.reminderTime : DEFAULT_DESKTOP_SETTINGS.reminderTime,
    closeToTray: typeof v.closeToTray === "boolean" ? v.closeToTray : DEFAULT_DESKTOP_SETTINGS.closeToTray,
    launchAtLogin: typeof v.launchAtLogin === "boolean" ? v.launchAtLogin : DEFAULT_DESKTOP_SETTINGS.launchAtLogin,
  };
}

function localDate(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Remind at most once a day, after the chosen time, and only on days with nothing logged —
 * days the user already logged stay quiet.
 */
export function shouldSendReminder(
  now: Date,
  settings: DesktopSettings,
  transactions: Transaction[],
  lastRemindedOn: string | null
): boolean {
  if (!settings.reminderEnabled) return false;
  const today = localDate(now);
  if (lastRemindedOn === today) return false;
  const [hours, minutes] = settings.reminderTime.split(":").map(Number);
  if (now.getHours() * 60 + now.getMinutes() < hours * 60 + minutes) return false;
  return !transactions.some((tx) => tx.date === today);
}

export { localDate as reminderDateKey };
