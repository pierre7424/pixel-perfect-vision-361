import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguagePicker } from "@/components/language-picker";
import { languageLabel, useI18n } from "@/lib/i18n";
import { findLanguage } from "@/lib/languages";
import { SESSION_HOURS, createSession as createSessionFn } from "@/lib/conversation.functions";

export const Route = createFileRoute("/nouvelle")({
  head: () => ({
    meta: [
      { title: "Créer une session — Deux voix" },
      {
        name: "description",
        content:
          "Choisissez les deux langues, décidez pour la localisation, confirmez, puis partagez un QR temporaire.",
      },
      { property: "og:title", content: "Créer une session — Deux voix" },
      {
        property: "og:description",
        content: "Deux langues, une confirmation manuelle, un lien temporaire à partager.",
      },
    ],
  }),
  component: NewSessionPage,
});

type GeoChoice = "unset" | "allowed" | "declined";

function NewSessionPage() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const createSession = useServerFn(createSessionFn);

  const [step, setStep] = useState(1);
  const [hostLang, setHostLang] = useState<string | null>(null);
  const [guestLang, setGuestLang] = useState<string | null>(null);
  const [showZhConfirm, setShowZhConfirm] = useState(false);
  const [geo, setGeo] = useState<GeoChoice>("unset");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Taipei") {
      setGuestLang("zh-TW");
      setShowZhConfirm(true);
    }
  }, []);

  async function askLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("declined");
      setGeoMessage(t.create.geoDenied);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeo("allowed");
        setGeoMessage(t.create.geoGranted);
      },
      () => {
        setGeo("declined");
        setGeoMessage(t.create.geoDenied);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  async function confirmAndCreate() {
    if (!hostLang || !guestLang) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createSession({
        data: { hostLang, guestLang, geolocationAllowed: geo === "allowed" },
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
      <p className="text-sm font-medium text-accent">
        {t.create.step} {step} {t.create.of} 4
      </p>
      <h1 className="mt-2 text-2xl font-bold">{t.create.title}</h1>

      <div className="glass-card mt-6 p-5 sm:p-6">
        {step === 1 ? (
          <>
            <h2 id="host-lang" className="text-lg font-semibold">
              {t.create.q1}
            </h2>
            <div className="mt-4">
              <LanguagePicker value={hostLang} onChange={setHostLang} labelledBy="host-lang" />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 id="guest-lang" className="text-lg font-semibold">
              {t.create.q2}
            </h2>

            {showZhConfirm && guestLang === "zh-TW" ? (
              <div className="mt-4 rounded-xl border border-accent/50 bg-accent/10 p-4">
                <p className="font-medium">{t.create.zhTwTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t.create.zhTwText}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowZhConfirm(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    <Check className="size-4" aria-hidden />
                    {t.create.zhTwAccept}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowZhConfirm(false);
                      setGuestLang(null);
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                  >
                    {t.create.zhTwChange}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <LanguagePicker value={guestLang} onChange={setGuestLang} labelledBy="guest-lang" />
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="size-5 text-accent" aria-hidden />
              {t.create.geoTitle}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{t.create.geoText}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void askLocation()}
                className="rounded-xl border border-border bg-surface px-4 py-3 font-medium"
              >
                {t.create.geoAllow}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeo("declined");
                  setGeoMessage(null);
                  setStep(4);
                }}
                className="rounded-xl bg-[image:var(--gradient-primary)] px-4 py-3 font-semibold text-primary-foreground"
              >
                {t.create.geoSkip}
              </button>
            </div>
            {geoMessage ? (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                {geoMessage}
              </p>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2 className="text-lg font-semibold">{t.create.confirmTitle}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border/70 pb-3">
                <dt className="text-muted-foreground">{t.create.youSpeak}</dt>
                <dd className="text-right font-medium">
                  {languageLabel(findLanguage(hostLang ?? ""), locale)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/70 pb-3">
                <dt className="text-muted-foreground">{t.create.partnerSpeaks}</dt>
                <dd className="text-right font-medium">
                  {languageLabel(findLanguage(guestLang ?? ""), locale)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/70 pb-3">
                <dt className="text-muted-foreground">{t.create.geolocation}</dt>
                <dd className="text-right font-medium">
                  {geo === "allowed" ? t.create.allowed : t.create.notAllowed}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t.create.expiry}</dt>
                <dd className="text-right font-medium">
                  {SESSION_HOURS} {t.create.hours}
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              {t.create.dataNote}{" "}
              <a href="/confidentialite" className="underline underline-offset-4">
                {t.nav.privacy}
              </a>
            </p>

            <button
              type="button"
              disabled={creating}
              onClick={() => void confirmAndCreate()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-4 font-semibold text-primary-foreground disabled:opacity-60"
            >
              {creating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              {creating ? t.create.creating : t.create.confirm}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-3 w-full rounded-xl border border-border px-5 py-3 text-sm font-medium"
            >
              {t.create.edit}
            </button>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {step < 4 ? (
        <div className="mt-5 flex items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm font-medium"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t.create.back}
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !hostLang : !guestLang || showZhConfirm}
              onClick={() => setStep(step + 1)}
              className="ml-auto rounded-xl bg-[image:var(--gradient-primary)] px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {t.create.next}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
