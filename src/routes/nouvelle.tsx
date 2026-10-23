import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguagePicker } from "@/components/language-picker";
import { useI18n } from "@/lib/i18n";
import { detectBrowserSpoken } from "@/lib/languages";
import { createSession as createSessionFn, type SessionDuration } from "@/lib/conversation.functions";

export const Route = createFileRoute("/nouvelle")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Créer une session — Deux voix" },
      {
        name: "description",
        content:
          "Choisissez votre langue et partagez un QR temporaire : chacun parle sa langue.",
      },
      { property: "og:title", content: "Créer une session — Deux voix" },
      {
        property: "og:description",
        content: "Un clic, un QR temporaire, chaque participant lit dans sa langue.",
      },
    ],
  }),
  component: NewSessionPage,
});

function NewSessionPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const createSession = useServerFn(createSessionFn);

  const [hostLang, setHostLang] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState<SessionDuration>("1w");
  const { locale } = useI18n();
  const L = CL[locale] ?? CL.en!;

  useEffect(() => {
    setHostLang((v) => v ?? detectBrowserSpoken() ?? "fr");
  }, []);

  async function create() {
    if (!hostLang) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createSession({
        data: { hostLang, guestLang: hostLang, geolocationAllowed: false, name: name.trim() || undefined, duration },
      });
      if (!res.ok) {
        setError(t.errors.generic);
        return;
      }
      window.localStorage.setItem(`role-${res.session.token}`, "host");
      void navigate({ to: "/s/$token", params: { token: res.session.token } });
    } catch {
      setError(t.errors.network);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t.create.title}</h1>
      <div className="glass-card mt-6 p-5 sm:p-6">
        <h2 id="host-lang" className="text-lg font-semibold">
          {t.create.q1}
        </h2>
        <div className="mt-4">
          <LanguagePicker value={hostLang} onChange={setHostLang} labelledBy="host-lang" />
        </div>
        <label className="mt-6 block text-sm font-semibold" htmlFor="session-name">
          {L.name}
        </label>
        <input
          id="session-name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder={L.namePh}
          className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-primary"
        />
        <p className="mt-6 text-sm font-semibold">{L.duration}</p>
        <div role="radiogroup" className="mt-2 grid grid-cols-2 gap-2">
          {(["4h", "24h", "1w", "unlimited"] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={duration === d}
              onClick={() => setDuration(d)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${duration === d ? "border-primary bg-primary/15" : "border-border bg-surface"}`}
            >
              {L.d[d]}
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          {t.create.dataNote}{" "}
          <a href="/confidentialite" className="underline underline-offset-4">
            {t.nav.privacy}
          </a>
        </p>
        <button
          type="button"
          disabled={creating || !hostLang}
          onClick={() => void create()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {creating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
          {creating ? t.create.creating : t.create.confirm}
        </button>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const CL: Record<string, { name: string; namePh: string; duration: string; d: Record<SessionDuration, string> }> = {
  fr: { name: "Nom de la session (facultatif)", namePh: "Ex. : Voyage à Taipei", duration: "Durée de la session", d: { "4h": "4 heures", "24h": "24 heures", "1w": "1 semaine", unlimited: "Illimitée" } },
  en: { name: "Session name (optional)", namePh: "e.g. Trip to Taipei", duration: "Session length", d: { "4h": "4 hours", "24h": "24 hours", "1w": "1 week", unlimited: "Unlimited" } },
  zh: { name: "對話名稱（選填）", namePh: "例如：台北之旅", duration: "對話時長", d: { "4h": "4 小時", "24h": "24 小時", "1w": "1 週", unlimited: "無限制" } },
};
