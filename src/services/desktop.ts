import { invoke, isTauri } from "@tauri-apps/api/core";

// Desktop-only integrations. In a plain browser (dev preview, tests) every call is a no-op.
export const isDesktopApp = (): boolean => {
  try {
    return isTauri();
  } catch {
    return false;
  }
};

export async function setCloseToTray(enabled: boolean): Promise<void> {
  if (!isDesktopApp()) return;
  await invoke("set_close_to_tray", { enabled });
}

export async function setLaunchAtLogin(enabled: boolean): Promise<void> {
  if (!isDesktopApp()) return;
  const autostart = await import("@tauri-apps/plugin-autostart");
  if (enabled) await autostart.enable();
  else await autostart.disable();
}

export async function sendDesktopNotification(title: string, body: string): Promise<boolean> {
  if (!isDesktopApp()) return false;
  const notification = await import("@tauri-apps/plugin-notification");
  let granted = await notification.isPermissionGranted();
  if (!granted) granted = (await notification.requestPermission()) === "granted";
  if (!granted) return false;
  notification.sendNotification({ title, body });
  return true;
}
