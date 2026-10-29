/** Single, guarded registration of the offline cache worker (/sw.js). */
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const PREVIEW_ROOTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  if (window.top !== window.self) return true;
  const h = window.location.hostname.toLowerCase();
  const label = h.split(".")[0] ?? "";
  if (PREVIEW_ROOTS.some((r) => h.endsWith(r)) && (PREVIEW_LABEL.test(label) || /^project--.+-dev$/.test(label)))
    return true;
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"])
    if (h === d || h.endsWith("." + d)) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith("/sw.js")))
      .map((r) => r.unregister()),
  );
}

export function registerOfflineWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (refused()) {
    void unregisterAppWorkers().catch(() => {});
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}
