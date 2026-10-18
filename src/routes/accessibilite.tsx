import { createFileRoute } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/accessibilite")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Accessibilité — Deux voix" },
      {
        name: "description",
        content:
          "Contraste, états non colorés, réduction des animations, navigation clavier et lecteurs d'écran.",
      },
      { property: "og:title", content: "Accessibilité — Deux voix" },
      {
        property: "og:description",
        content: "Nos engagements d'accessibilité sur cette version et les limites connues.",
      },
    ],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.accessibility.title}</h1>
      <p className="mt-4 text-muted-foreground">{t.accessibility.intro}</p>
      <div className="mt-8 space-y-4">
        {t.accessibility.sections.map((s) => (
          <section key={s.h} className="glass-card p-6">
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
