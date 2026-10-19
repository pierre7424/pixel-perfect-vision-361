import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { resolveJoinCode as resolveJoinCodeFn } from "@/lib/conversation.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/rejoindre")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Rejoindre une conversation — Deux voix" },
      {
        name: "description",
        content:
          "Scannez le QR, ouvrez le lien reçu ou saisissez le code à 5 chiffres pour rejoindre une conversation traduite.",
      },
      { property: "og:title", content: "Rejoindre une conversation — Deux voix" },
      {
        property: "og:description",
        content: "Un code à 5 chiffres suffit : aucun compte requis, le micro reste sous votre contrôle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});

const L: Record<string, { label: string; help: string; bad: string; cta: string }> = {
  fr: {
    label: "Code de session à 5 chiffres",
    help: "Vous pouvez aussi scanner le QR code avec l'appareil photo ou toucher le lien reçu sur WhatsApp, LINE, Telegram…",
    bad: "Code invalide ou expiré. Demandez un nouveau code au créateur de la session.",
    cta: "Rejoindre",
  },
  en: {
    label: "5-digit session code",
    help: "You can also scan the QR code with your camera or tap the link received on WhatsApp, LINE, Telegram…",
    bad: "Invalid or expired code. Ask the session creator for a new one.",
    cta: "Join",
  },
  zh: {
    label: "5 位數對話代碼",
    help: "您也可以用相機掃描 QR 碼，或點擊在 WhatsApp、LINE、Telegram 收到的連結。",
    bad: "代碼無效或已過期，請向建立者索取新代碼。",
    cta: "加入",
  },
};

function JoinPage() {
  const { t, locale } = useI18n();
  const T = L[locale] ?? L["en"]!;
  const navigate = useNavigate();
  const resolve = useServerFn(resolveJoinCodeFn);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(code: string) {
    if (!/^\d{5}$/.test(code)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await resolve({ data: { code } });
      if (res.ok) {
        void navigate({ to: "/s/$token", params: { token: res.token } });
      } else setError(T.bad);
    } catch {
      setError(T.bad);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">{t.home.ctaSecondary}</h1>

      <div className="glass-card mt-6 p-6">
        <label htmlFor="join-code" className="text-sm font-medium">
          {T.label}
        </label>
        <input
          id="join-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={5}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 5);
            setValue(v);
            setError(null);
            if (v.length === 5) void go(v);
          }}
          placeholder="•••••"
          className="mt-2 w-full rounded-xl border border-input bg-surface px-4 py-3 text-center font-mono text-3xl tracking-[0.4em]"
        />
        <button
          type="button"
          disabled={busy || value.length !== 5}
          onClick={() => void go(value)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {T.cta}
        </button>
        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">{T.help}</p>
      </div>
    </div>
  );
}
