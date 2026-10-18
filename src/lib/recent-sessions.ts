/** Sessions this browser created or joined, kept locally for one-tap return. */
export type RecentSession = {
  token: string;
  role: "host" | "guest";
  expiresAt: string;
  name: string;
  lastVisit: number;
};

const KEY = "recent-sessions";

export function listRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as RecentSession[];
    const now = Date.now();
    return all
      .filter((s) => s && s.token && new Date(s.expiresAt).getTime() > now)
      .sort((a, b) => b.lastVisit - a.lastVisit);
  } catch {
    return [];
  }
}

function save(list: RecentSession[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function rememberSession(s: Omit<RecentSession, "lastVisit">) {
  if (typeof window === "undefined") return;
  const prev = listRecentSessions().find((x) => x.token === s.token);
  const rest = listRecentSessions().filter((x) => x.token !== s.token);
  save([{ ...s, name: s.name || prev?.name || "", lastVisit: Date.now() }, ...rest]);
}

export function forgetSession(token: string) {
  if (typeof window === "undefined") return;
  save(listRecentSessions().filter((x) => x.token !== token));
}

const readKey = (token: string) => `read-${token}`;

export function lastRead(token: string): string {
  if (typeof window === "undefined") return new Date().toISOString();
  return window.localStorage.getItem(readKey(token)) ?? new Date(0).toISOString();
}

export function markSessionRead(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(readKey(token), new Date().toISOString());
}
