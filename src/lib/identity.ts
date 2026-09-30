/**
 * Per-browser identity: a stable anonymous client id (used for presence)
 * and a per-session display name (pseudo) chosen by the participant.
 */
const CLIENT_KEY = "client-id";

function randomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function clientId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = randomId();
    window.localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
}

export function storedName(token: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`name-${token}`) ?? "";
}

export function storeName(token: string, name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`name-${token}`, name.slice(0, 40));
}
