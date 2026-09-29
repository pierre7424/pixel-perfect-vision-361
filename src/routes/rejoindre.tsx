import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/rejoindre")({
  head: () => ({
    meta: [
      { title: "Rejoindre une conversation — Deux voix" },
      {
        name: "description",
        content:
          "Scannez le QR partagé ou collez le lien de session pour rejoindre une conversation traduite.",
      },
      { property: "og:title", content: "Rejoindre une conversation — Deux voix" },
      {
        property: "og:description",
        content: "Collez le lien reçu : aucun compte requis, le micro reste sous votre contrôle.",
      },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function go() {
    const match = value.trim().match(/([0-9a-f]{20,64})/i);
    const found = match?.[1];
    if (!found) {
      setError(t.errors.linkGone);
      return;
    }
    void navigate({ to: "/s/$token", params: { token: found } });
  }


  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">{t.home.ctaSecondary}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t.qr.short}</p>

      <div className="glass-card mt-6 p-6">
        <label htmlFor="join-link" className="text-sm font-medium">
          {t.join.session}
        </label>
        <input
          id="join-link"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="https://…/s/…"
          className="mt-2 w-full rounded-xl border border-input bg-surface px-4 py-3 text-base"
        />
        <button
          type="button"
          onClick={go}
          className="mt-4 w-full rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 font-semibold text-primary-foreground"
        >
          {t.join.joinCta}
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
