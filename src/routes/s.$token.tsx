import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Loader2, Mic, RefreshCw, Share2, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { ConversationView } from "@/components/conversation-view";
import { LanguagePicker } from "@/components/language-picker";
import { languageLabel, useI18n } from "@/lib/i18n";
import { findLanguage } from "@/lib/languages";
import { useRecorder } from "@/lib/use-recorder";
import {
  endSession as endSessionFn,
  getSession as getSessionFn,
  joinSession as joinSessionFn,
  regenerateLink as regenerateLinkFn,
  type FailureCode,
  type SessionPublic,
} from "@/lib/conversation.functions";

export const Route = createFileRoute("/s/$token")({
  head: () => ({
    meta: [
      { title: "Conversation traduite — Deux voix" },
      {
        name: "description",
        content:
          "Session temporaire : parlez chacun votre langue, l'original et la traduction s'affichent à l'écran.",
      },
      { property: "og:title", content: "Conversation traduite — Deux voix" },
      {
        property: "og:description",
        content: "Scannez pour parler chacun votre langue. Session temporaire — aucun compte requis.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { token } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();

  const getSession = useServerFn(getSessionFn);
  const [session, setSession] = useState<SessionPublic | null>(null);
  const [failure, setFailure] = useState<FailureCode | null>(null);
  const [role, setRole] = useState<"host" | "guest" | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setRole(window.localStorage.getItem(`role-${token}`) === "host" ? "host" : "guest");
  }, [token]);

  const load = useCallback(async () => {
    try {
      const res = await getSession({ data: { token } });
      if (!res.ok) {
        setFailure(res.code);
        return;
      }
      setFailure(null);
      setSession(res.session);
    } catch {
      setFailure("unavailable");
    }
  }, [getSession, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (failure) {
    const message =
      failure === "ended"
        ? t.errors.sessionEnded
        : failure === "unavailable"
          ? t.errors.network
          : t.errors.linkGone;
    return (
      <div className="glass-card mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">{message}</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 font-semibold text-primary-foreground"
        >
          {t.errors.backHome}
        </Link>
      </div>
    );
  }

  if (!session || !role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-primary" aria-label="…" />
      </div>
    );
  }

  if (role === "host" && !entered) {
    return (
      <HostInvite
        session={session}
        onRefresh={load}
        onEnter={() => setEntered(true)}
        onReplaced={(next) => {
          window.localStorage.removeItem(`role-${session.token}`);
          window.localStorage.setItem(`role-${next.token}`, "host");
          void navigate({ to: "/s/$token", params: { token: next.token } });
        }}
      />
    );
  }

  if (role === "guest" && !entered) {
    return (
      <GuestWelcome
        session={session}
        onJoined={(next) => {
          setSession(next);
          setEntered(true);
        }}
      />
    );
  }

  return (
    <ConversationView
      key={session.token}
      role={role}
      initialSession={session}
      micReady={role === "guest" ? guestMicReady : false}
    />
  );
}

/** Set by the guest consent screen before entering the conversation. */
let guestMicReady = false;

function HostInvite({
  session,
  onRefresh,
  onEnter,
  onReplaced,
}: {
  session: SessionPublic;
  onRefresh: () => Promise<void>;
  onEnter: () => void;
  onReplaced: (s: SessionPublic) => void;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const endSession = useServerFn(endSessionFn);
  const regenerate = useServerFn(regenerateLinkFn);

  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const link = shareLink(session.token);
    setUrl(link);
    void QRCode.toDataURL(link, {
      width: 520,
      margin: 1,
      color: { dark: "#0b1a20", light: "#ffffff" },
    }).then(setQr);
  }, [session.token]);

  useEffect(() => {
    const id = setInterval(() => void onRefresh(), 3000);
    return () => clearInterval(id);
  }, [onRefresh]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t.qr.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {languageLabel(findLanguage(session.hostLang), locale)} ↔{" "}
        {languageLabel(findLanguage(session.guestLang), locale)}
      </p>

      <div className="glass-card mt-6 p-6">
        <div className="mx-auto w-fit rounded-2xl bg-white p-3">
          {qr ? (
            <img src={qr} alt={t.qr.short} className="size-56 sm:size-64" />
          ) : (
            <div className="grid size-56 place-items-center sm:size-64">
              <Loader2 className="size-6 animate-spin text-background" aria-hidden />
            </div>
          )}
        </div>

        <p className="mt-5 text-sm leading-relaxed">{t.qr.invite}</p>
        <p className="mt-3 rounded-xl border border-border bg-surface p-3 text-sm font-medium">
          {t.qr.short}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 font-medium"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? t.qr.copied : t.qr.copy}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: t.qr.title, text: t.qr.short, url });
                } catch {
                  /* dismissed */
                }
              } else {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              }
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-3 font-semibold text-primary-foreground"
          >
            <Share2 className="size-4" aria-hidden />
            {t.qr.share}
          </button>
        </div>

        <p
          role="status"
          className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${session.guestJoined ? "bg-success" : "bg-primary"}`}
          />
          {session.guestJoined ? t.qr.joined : t.qr.waiting}
        </p>
      </div>

      <button
        type="button"
        onClick={onEnter}
        className="mt-5 w-full rounded-xl bg-[image:var(--gradient-primary)] px-5 py-4 font-semibold text-primary-foreground"
      >
        {t.qr.enter}
      </button>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={working}
          onClick={async () => {
            setWorking(true);
            const res = await regenerate({ data: { token: session.token } });
            setWorking(false);
            if (res.ok) onReplaced(res.session);
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium"
        >
          <RefreshCw className="size-4" aria-hidden />
          {t.qr.regenerate}
        </button>
        <button
          type="button"
          disabled={working}
          onClick={async () => {
            setWorking(true);
            await endSession({ data: { token: session.token } });
            void navigate({ to: "/" });
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/50 px-4 py-3 text-sm font-medium text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
          {t.qr.cancel}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t.qr.regenerateNote}</p>
    </div>
  );
}

function GuestWelcome({
  session,
  onJoined,
}: {
  session: SessionPublic;
  onJoined: (s: SessionPublic) => void;
}) {
  const { t, locale } = useI18n();
  const join = useServerFn(joinSessionFn);
  const recorder = useRecorder();

  const [lang, setLang] = useState(session.guestLang);
  const [editingLang, setEditingLang] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function enter(withMic: boolean) {
    setWorking(true);
    setError(null);
    if (withMic) {
      const ok = await recorder.requestMic();
      guestMicReady = ok;
      if (!ok) {
        setError(recorder.micState === "unavailable" ? t.errors.micUnavailable : t.errors.micDenied);
        setWorking(false);
        return;
      }
    } else {
      guestMicReady = false;
    }

    const res = await join({ data: { token: session.token, guestLang: lang } });
    setWorking(false);
    if (!res.ok) {
      setError(res.code === "ended" ? t.errors.sessionEnded : t.errors.linkGone);
      return;
    }
    onJoined(res.session);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t.join.title}</h1>

      <div className="glass-card mt-6 p-6">
        <p className="text-sm leading-relaxed">{t.qr.invite}</p>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t.join.languages}</dt>
            <dd className="text-right font-medium">
              {languageLabel(findLanguage(session.hostLang), locale)} ↔{" "}
              {languageLabel(findLanguage(lang), locale)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t.join.expires}</dt>
            <dd className="text-right font-medium">
              {new Date(session.expiresAt).toLocaleTimeString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="glass-card mt-4 p-6">
        <h2 className="text-lg font-semibold">{t.join.chooseYourLang}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.join.chooseNote}</p>
        {editingLang ? (
          <div className="mt-4">
            <LanguagePicker value={lang} onChange={setLang} />
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="font-medium">{languageLabel(findLanguage(lang), locale)}</span>
            <button
              type="button"
              onClick={() => setEditingLang(true)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
            >
              {t.create.edit}
            </button>
          </div>
        )}
      </div>

      <div className="glass-card mt-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Mic className="size-5 text-accent" aria-hidden />
          {t.join.micTitle}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.join.micText}</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={working}
            onClick={() => void enter(true)}
            className="flex-1 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {t.join.micAllow}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => void enter(false)}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 font-medium disabled:opacity-60"
          >
            {t.join.micLater}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
