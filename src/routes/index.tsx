import { Link, createFileRoute } from "@tanstack/react-router";
import { MessagesSquare, QrCode, ShieldCheck, Timer, Mic, Languages } from "lucide-react";

import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deux voix — parlez chacun votre langue" },
      {
        name: "description",
        content:
          "Créez une session, partagez un QR temporaire et échangez vocalement avec une traduction affichée. Aucun compte obligatoire pour essayer.",
      },
      { property: "og:title", content: "Deux voix — parlez chacun votre langue" },
      {
        property: "og:description",
        content:
          "Une conversation, deux langues, un lien. Session temporaire par QR, consentement micro explicite.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 animate-drift rounded-full bg-accent/10 blur-3xl"
      />

      <section className="relative mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:pt-20">
        <p className="animate-rise text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {t.home.overline}
        </p>
        <h1 className="animate-rise mt-5 text-4xl font-bold leading-[1.1] sm:text-6xl">
          <span className="text-gradient">{t.home.title}</span>
        </h1>
        <p className="animate-rise mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          {t.home.subtitle}
        </p>

        <div className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/nouvelle"
            className="rounded-2xl bg-[image:var(--gradient-primary)] px-6 py-4 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-[0.98]"
          >
            {t.home.ctaPrimary}
          </Link>
          <Link
            to="/rejoindre"
            className="rounded-2xl border border-border bg-surface px-6 py-4 text-base font-semibold transition-colors hover:bg-secondary"
          >
            {t.home.ctaSecondary}
          </Link>
        </div>

        <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-4" aria-hidden>
          <span className="glass-card animate-drift grid size-16 place-items-center text-2xl">
            🗣️
          </span>
          <span className="h-px flex-1 bg-[image:var(--gradient-primary)] opacity-60" />
          <span
            className="glass-card animate-drift grid size-16 place-items-center text-2xl"
            style={{ animationDelay: "1.2s" }}
          >
            💬
          </span>
        </div>

        <p className="mx-auto mt-10 max-w-lg text-sm text-muted-foreground">{t.home.reassurance}</p>
        <p className="mx-auto mt-3 max-w-lg text-xs text-muted-foreground">{t.home.privacyNote}</p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-center text-2xl font-semibold">{t.home.stepsTitle}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Languages, title: t.home.step1, text: t.home.step1Text },
            { icon: QrCode, title: t.home.step2, text: t.home.step2Text },
            { icon: MessagesSquare, title: t.home.step3, text: t.home.step3Text },
          ].map((step, i) => (
            <li key={step.title} className="glass-card p-6">
              <step.icon className="size-6 text-primary" aria-hidden />
              <p className="mt-4 text-sm font-semibold text-muted-foreground">{i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="text-2xl font-semibold">{t.home.howTitle}</h2>
        <p className="mt-3 text-muted-foreground">{t.home.howText}</p>

        <div className="glass-card mt-6 p-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t.home.exampleOriginal}
          </p>
          <p className="mt-1 text-base">{t.home.exampleOriginalText}</p>
          <p className="mt-5 border-t border-border/70 pt-4 text-xs uppercase tracking-wide text-muted-foreground">
            {t.home.exampleTranslated}
          </p>
          <p className="mt-1 text-xl font-medium">{t.home.exampleTranslatedText}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-2xl font-semibold">{t.home.trustTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Mic, title: t.home.trust1Title, text: t.home.trust1Text },
            { icon: Timer, title: t.home.trust2Title, text: t.home.trust2Text },
            { icon: ShieldCheck, title: t.home.trust3Title, text: t.home.trust3Text },
          ].map((item) => (
            <div key={item.title} className="surface-panel p-5">
              <item.icon className="size-5 text-accent" aria-hidden />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">{t.home.languagesNote}</p>
      </section>
    </div>
  );
}
