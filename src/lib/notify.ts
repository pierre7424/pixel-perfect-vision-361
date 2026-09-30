/**
 * Local push notifications for new messages while the conversation page is in
 * the background (other tab, other app, locked screen). Uses the browser
 * Notification API — no account and no third-party service.
 */

export type NotifyStatus = "unsupported" | "in-iframe" | "default" | "granted" | "denied";

export function notifyStatus(): NotifyStatus {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (window.top !== window.self) return "in-iframe";
  return Notification.permission as NotifyStatus;
}

/** Must be called from a user gesture. */
export async function requestNotifications(): Promise<NotifyStatus> {
  const current = notifyStatus();
  if (current !== "default") return current;
  try {
    const result = await Notification.requestPermission();
    return result as NotifyStatus;
  } catch {
    return "denied";
  }
}

let last = 0;

export function notifyMessage(title: string, body: string) {
  if (notifyStatus() !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return;
  const now = Date.now();
  if (now - last < 1500) return;
  last = now;
  try {
    const n = new Notification(title, {
      body,
      tag: "deux-voix-message",
      icon: "/favicon.ico",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* some browsers require a service worker; ignore silently */
  }
}
