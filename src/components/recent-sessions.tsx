import { Link } from "@tanstack/react-router";
import { MessagesSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { forgetSession, listRecentSessions, type RecentSession } from "@/lib/recent-sessions";

const LABELS: Record<string, { title: string; host: string; guest: string; left: string; remove: string; open: string; days: string }> = {
  fr: { title: "Vos conversations", host: "Créateur", guest: "Invité", left: "Expire dans", remove: "Retirer de la liste", open: "Ouvrir", days: "j" },
  en: { title: "Your conversations", host: "Host", guest: "Guest", left: "Expires in", remove: "Remove from list", open: "Open", days: "d" },
  zh: { title: "您的對話", host: "建立者", guest: "訪客", left: "剩餘", remove: "從清單移除", open: "開啟", days: "天" },
};

function remaining(iso: string, d: string) {
  const ms = Math.max(0, new Date(iso).getTime() - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days} ${d} ${hours} h` : `${hours} h ${Math.floor((ms % 3_600_000) / 60_000)}`;
}

export function RecentSessions() {
  const { locale } = useI18n();
  const L = LABELS[locale] ?? LABELS["en"]!;
  const [list, setList] = useState<RecentSession[]>([]);
  useEffect(() => setList(listRecentSessions()), []);
  if (list.length === 0) return null;

  return (
    <div className="glass-card animate-rise mx-auto mt-8 max-w-md p-4 text-left">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">{L.title}</h2>
      <ul className="space-y-2">
        {list.map((s, i) => (
          <li key={s.token} className="flex items-center gap-2">
            <Link
              to="/s/$token"
              params={{ token: s.token }}
              aria-label={`${L.open} ${s.name || `#${i + 1}`}`}
              className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-secondary"
            >
              <MessagesSquare className="size-5 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {s.name || `Conversation ${list.length - i}`}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {s.role === "host" ? L.host : L.guest} · {L.left} {remaining(s.expiresAt, L.days)}
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label={L.remove}
              onClick={() => {
                forgetSession(s.token);
                setList(listRecentSessions());
              }}
              className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
