import { createFileRoute } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/confidentialite")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Confidentialité — Deux voix" },
      {
        name: "description",
        content:
          "Données traitées, conservation, fournisseurs et sécurité des sessions de conversation traduite.",
      },
      { property: "og:title", content: "Confidentialité — Deux voix" },
      {
        property: "og:description",
        content: "Ce que le service traite pour faire fonctionner une conversation traduite.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.privacy.title}</h1>
      <p className="mt-4 text-muted-foreground">{t.privacy.intro}</p>
      <div className="mt-8 space-y-4">
        {t.privacy.sections.map((s) => (
          <section key={s.h} className="glass-card p-6">
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
