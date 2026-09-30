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

/** True when the page runs inside a preview frame, where the browser blocks the prompt. */
export function isEmbedded(): boolean {
  return typeof window !== "undefined" && window.top !== window.self;
}

/**
 * Ask the browser for permission. Handles both the modern promise API and the
 * older callback-only API (older Safari), and never throws.
 */
export async function requestNotifications(): Promise<NotifyStatus> {
  const current = notifyStatus();
  if (current !== "default") return current;
  try {
    const result = await new Promise<NotificationPermission>((resolve) => {
      let settled = false;
      const done = (p: NotificationPermission) => {
        if (!settled) {
          settled = true;
          resolve(p);
        }
      };
      try {
        const maybe = Notification.requestPermission(done);
        if (maybe && typeof (maybe as Promise<NotificationPermission>).then === "function") {
          void (maybe as Promise<NotificationPermission>).then(done).catch(() => done("default"));
        }
      } catch {
        done("default");
      }
    });
    return result as NotifyStatus;
  } catch {
    return "default";
  }
}

/**
 * Turn notifications on by default: try immediately, and if the browser wants a
 * real interaction first, retry on the very next tap or click.
 * Returns a cleanup function.
 */
export function enableNotificationsByDefault(onStatus: (s: NotifyStatus) => void): () => void {
  let cancelled = false;
  const report = (s: NotifyStatus) => {
    if (!cancelled) onStatus(s);
  };

  const attempt = async () => {
    const s = await requestNotifications();
    report(s);
    return s;
  };

  const initial = notifyStatus();
  report(initial);

  if (initial !== "default") return () => {
    cancelled = true;
  };

  const onGesture = () => {
    void attempt();
    remove();
  };
  const remove = () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };

  void attempt().then((s) => {
    if (s === "default" && !cancelled) {
      window.addEventListener("pointerdown", onGesture, { once: true });
      window.addEventListener("keydown", onGesture, { once: true });
    }
  });

  return () => {
    cancelled = true;
    remove();
  };
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
