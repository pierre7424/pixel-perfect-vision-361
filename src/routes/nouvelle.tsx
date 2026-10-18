import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguagePicker } from "@/components/language-picker";
import { useI18n } from "@/lib/i18n";
import { detectBrowserSpoken } from "@/lib/languages";
import { SESSION_HOURS, createSession as createSessionFn } from "@/lib/conversation.functions";

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

  useEffect(() => {
    setHostLang((v) => v ?? detectBrowserSpoken() ?? "fr");
  }, []);

  async function create() {
    if (!hostLang) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createSession({
        data: { hostLang, guestLang: hostLang, geolocationAllowed: false },
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
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          {t.create.expiry} : {SESSION_HOURS / 24} × 24 {t.create.hours}. {t.create.dataNote}{" "}
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
