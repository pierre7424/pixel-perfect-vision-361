import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessagesSquare, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getUnreadCounts as getUnreadCountsFn } from "@/lib/conversation.functions";
import { useI18n } from "@/lib/i18n";
import { forgetSession, lastRead, listRecentSessions, type RecentSession } from "@/lib/recent-sessions";

const LABELS: Record<string, { title: string; host: string; guest: string; left: string; remove: string; open: string; days: string; unread: string; by: string; you: string; people: string }> = {
  fr: { title: "Vos conversations", host: "Créateur", guest: "Invité", left: "Expire dans", remove: "Retirer de la liste", open: "Ouvrir", days: "j", unread: "message(s) en attente", by: "Créé par", you: "vous", people: "participant(s)" },
  en: { title: "Your conversations", host: "Host", guest: "Guest", left: "Expires in", remove: "Remove from list", open: "Open", days: "d", unread: "unread message(s)", by: "Created by", you: "you", people: "participant(s)" },
  zh: { title: "您的對話", host: "建立者", guest: "訪客", left: "剩餘", remove: "從清單移除", open: "開啟", days: "天", unread: "則未讀訊息", by: "建立者", you: "您", people: "位參與者" },
};

const HINTS: Record<string, { empty: string; logo: string }> = {
  fr: {
    empty:
      "Vos salons apparaîtront ici automatiquement, ceux que vous créez comme ceux que vous rejoignez. Pendant 7 jours, vous pourrez y revenir en un clic sans rescanner le QR code, voir qui participe et les messages en attente.",
    logo: "Astuce : touchez le logo Deux voix en haut à gauche pour revenir ici à tout moment et passer d'une conversation à l'autre.",
  },
  en: {
    empty:
      "Your rooms will appear here automatically, both those you create and those you join. For 7 days you can return in one tap without rescanning the QR code, see who's there and any waiting messages.",
    logo: "Tip: tap the Deux voix logo at the top left to come back here anytime and switch between conversations.",
  },
  zh: {
    empty: "您建立或加入的對話會自動顯示在這裡。7 天內可一鍵返回，無需重新掃描 QR 碼，並查看參與者與未讀訊息。",
    logo: "提示：隨時點擊左上角的 Deux voix 標誌即可回到這裡，在對話之間切換。",
  },
};

function remaining(iso: string, d: string) {
  if (new Date(iso).getFullYear() > 2900) return "∞";
  const ms = Math.max(0, new Date(iso).getTime() - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days} ${d} ${hours} h` : `${hours} h ${Math.floor((ms % 3_600_000) / 60_000)}`;
}

export function RecentSessions() {
  const { locale } = useI18n();
  const L = LABELS[locale] ?? LABELS["en"]!;
  const [list, setList] = useState<RecentSession[]>([]);
  const [unread, setUnread] = useState<Record<string, { unread: number; participants: number; hostName: string | null; sessionName?: string | null }>>({});
  const getUnread = useServerFn(getUnreadCountsFn);
  useEffect(() => setList(listRecentSessions()), []);
  useEffect(() => {
    if (list.length === 0) return;
    const load = () =>
      getUnread({
        data: {
          items: list.map((s) => ({ token: s.token, since: lastRead(s.token), name: s.name || undefined })),
        },
      })
        .then(setUnread)
        .catch(() => {});
    void load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [list, getUnread]);
  const H = HINTS[locale] ?? HINTS["en"]!;
  if (list.length === 0)
    return (
      <div className="glass-card animate-rise mx-auto mt-8 max-w-md p-4 text-left">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">{L.title}</h2>
        <p className="text-sm text-muted-foreground">{H.empty}</p>
        <p className="mt-2 text-xs text-muted-foreground">{H.logo}</p>
      </div>
    );

  return (
    <div className="glass-card animate-rise mx-auto mt-8 max-w-md p-4 text-left">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-accent">{L.title}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{H.logo}</p>
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
                {unread[s.token]?.sessionName ? (
                  <span className="block truncate font-semibold">{unread[s.token]!.sessionName}</span>
                ) : null}
                <span className="block truncate font-medium">
                  {s.role === "host"
                    ? `${L.by} ${s.name || "?"} (${L.you})`
                    : `${L.by} ${unread[s.token]?.hostName || "?"} (${s.name || L.you})`}
                </span>
                {unread[s.token] ? (
                  <span className="block text-xs text-muted-foreground">
                    {unread[s.token]!.participants} {L.people}
                  </span>
                ) : null}
                <span className="block text-xs text-muted-foreground">
                  {s.role === "host" ? L.host : L.guest} · {L.left} {remaining(s.expiresAt, L.days)}
                </span>
                {unread[s.token]?.unread ? (
                  <span className="block text-xs font-medium text-accent">
                    {unread[s.token]!.unread} {L.unread}
                  </span>
                ) : null}
              </span>
              {unread[s.token]?.unread ? (
                <span className="grid min-w-6 place-items-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  {unread[s.token]!.unread > 99 ? "99+" : unread[s.token]!.unread}
                </span>
              ) : null}
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
