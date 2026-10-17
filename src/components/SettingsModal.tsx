import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "../constants/motion";
import { BellRinging, X } from "./icons";
import { useTranslation } from "react-i18next";
import { useDialogFocus } from "../hooks/useDialogFocus";
import type { DesktopSettings } from "../utils/reminders";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DesktopSettings;
  onChange: (next: DesktopSettings) => void;
  isDesktop: boolean;
  onTestNotification: () => Promise<boolean>;
}

const Toggle: React.FC<{ id: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void; label: string; hint?: string }> = ({
  id, checked, disabled, onChange, label, hint,
}) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-ink)]">{label}</label>
      {hint && <p id={`${id}-hint`} className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{hint}</p>}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={hint ? `${id}-hint` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${
        checked ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--color-line)] bg-[var(--color-surface-subtle)]"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onChange, isDesktop, onTestNotification }) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialogRef);
  const [testResult, setTestResult] = useState<"sent" | "failed" | null>(null);

  useEffect(() => {
    if (isOpen) setTestResult(null);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={SPRING.overlay}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-6 py-4">
              <div>
                <h2 id="settings-modal-title" className="text-base font-bold tracking-tight text-[var(--color-ink)]">{t("settings.title")}</h2>
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">{t("settings.subtitle")}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t("ux.close")} className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-line-subtle)] hover:text-[var(--color-ink)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {!isDesktop && (
                <p role="note" className="rounded-xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] px-3 py-2 text-xs font-semibold text-[var(--amber-ink)]">
                  {t("settings.desktopOnly")}
                </p>
              )}

              <section className="space-y-3">
                <Toggle
                  id="setting-reminder"
                  checked={settings.reminderEnabled}
                  onChange={(reminderEnabled) => onChange({ ...settings, reminderEnabled })}
                  label={t("settings.reminder")}
                  hint={t("settings.reminderHint")}
                />
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="setting-reminder-time" className="text-xs font-semibold text-[var(--color-ink-soft)]">{t("settings.reminderTime")}</label>
                  <input
                    id="setting-reminder-time"
                    type="time"
                    value={settings.reminderTime}
                    disabled={!settings.reminderEnabled}
                    onChange={(e) => e.target.value && onChange({ ...settings, reminderTime: e.target.value })}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-sm text-[var(--color-ink)] outline-none focus:border-[var(--primary)] disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!isDesktop}
                    onClick={async () => setTestResult((await onTestNotification()) ? "sent" : "failed")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-surface)] disabled:opacity-50"
                  >
                    <BellRinging size={14} weight="duotone" />
                    {t("settings.testNotification")}
                  </button>
                  {testResult && (
                    <span role="status" className={`text-xs font-semibold ${testResult === "sent" ? "text-[var(--jade-ink)]" : "text-[var(--rose-ink)]"}`}>
                      {testResult === "sent" ? t("settings.testSent") : t("settings.testFailed")}
                    </span>
                  )}
                </div>
              </section>

              <section className="space-y-4 border-t border-[var(--color-line)] pt-4">
                <Toggle
                  id="setting-tray"
                  checked={settings.closeToTray}
                  disabled={!isDesktop}
                  onChange={(closeToTray) => onChange({ ...settings, closeToTray })}
                  label={t("settings.closeToTray")}
                  hint={t("settings.closeToTrayHint")}
                />
                <Toggle
                  id="setting-autostart"
                  checked={settings.launchAtLogin}
                  disabled={!isDesktop}
                  onChange={(launchAtLogin) => onChange({ ...settings, launchAtLogin })}
                  label={t("settings.launchAtLogin")}
                />
              </section>

              <p className="text-center text-xs text-[var(--color-ink-faint)]">
                <a href="https://lordicon.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[var(--color-ink-soft)]">
                  {t("savings.iconCredit")}
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
