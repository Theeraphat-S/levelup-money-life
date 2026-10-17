import { describe, expect, it } from "vitest";
import type { Transaction } from "../types";
import { DEFAULT_DESKTOP_SETTINGS, sanitizeDesktopSettings, shouldSendReminder } from "./reminders";

const at = (time: string) => new Date(`2026-10-17T${time}:00`);
const logged: Transaction = { id: "a", name: "Coffee", amount: -60, date: "2026-10-17", category: "Food", cleared: true };

describe("daily reminder", () => {
  it("waits until the reminder time", () => {
    expect(shouldSendReminder(at("19:59"), DEFAULT_DESKTOP_SETTINGS, [], null)).toBe(false);
    expect(shouldSendReminder(at("20:00"), DEFAULT_DESKTOP_SETTINGS, [], null)).toBe(true);
  });

  it("stays quiet when something was logged today", () => {
    expect(shouldSendReminder(at("21:00"), DEFAULT_DESKTOP_SETTINGS, [logged], null)).toBe(false);
    expect(shouldSendReminder(at("21:00"), DEFAULT_DESKTOP_SETTINGS, [{ ...logged, date: "2026-10-16" }], null)).toBe(true);
  });

  it("reminds at most once a day and respects the switch", () => {
    expect(shouldSendReminder(at("21:00"), DEFAULT_DESKTOP_SETTINGS, [], "2026-10-17")).toBe(false);
    expect(shouldSendReminder(at("21:00"), DEFAULT_DESKTOP_SETTINGS, [], "2026-10-16")).toBe(true);
    expect(shouldSendReminder(at("21:00"), { ...DEFAULT_DESKTOP_SETTINGS, reminderEnabled: false }, [], null)).toBe(false);
  });

  it("falls back to defaults for missing or malformed settings", () => {
    expect(sanitizeDesktopSettings(undefined)).toEqual(DEFAULT_DESKTOP_SETTINGS);
    expect(sanitizeDesktopSettings({ reminderTime: "25:00", closeToTray: false })).toEqual({ ...DEFAULT_DESKTOP_SETTINGS, closeToTray: false });
  });
});
