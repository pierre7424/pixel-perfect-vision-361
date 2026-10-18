import { rememberSession } from "@/lib/recent-sessions";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Loader2, Mic, RefreshCw, Share2, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { ConversationView } from "@/components/conversation-view";
import { LanguagePicker } from "@/components/language-picker";
import { NamePrompt } from "@/components/name-prompt";
import { clientId, storeName, storedName } from "@/lib/identity";
import { languageLabel, uiLocaleForSpoken, useI18n } from "@/lib/i18n";
import { detectBrowserSpoken, findLanguage, qrInvitation } from "@/lib/languages";
import { shareLink } from "@/lib/share-origin";
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
  staticData: { sitemap: false },
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
  const { t, setLocale } = useI18n();
  const navigate = useNavigate();

  const getSession = useServerFn(getSessionFn);
  const [session, setSession] = useState<SessionPublic | null>(null);
  const [failure, setFailure] = useState<FailureCode | null>(null);
  const [role, setRole] = useState<"host" | "guest" | null>(null);
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [myLang, setMyLang] = useState<string | null>(null);

  useEffect(() => {
    setRole(window.localStorage.getItem(`role-${token}`) === "host" ? "host" : "guest");
    setName(storedName(token) || null);
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
      rememberSession({
        token,
        role: window.localStorage.getItem(`role-${token}`) === "host" ? "host" : "guest",
        expiresAt: res.session.expiresAt,
        name: storedName(token),
      });
    } catch {
      setFailure("unavailable");
    }
  }, [getSession, token]);

  useEffect(() => {
    void load();
  }, [load]);

  // The guest's page follows their own browser language, not the host's.
  const hasSession = !!session;
  useEffect(() => {
    if (role === "guest" && hasSession) {
      const own = detectBrowserSpoken();
      if (own) setLocale(uiLocaleForSpoken(own));
    }
  }, [role, hasSession, setLocale]);

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

  // Every participant picks a pseudo once per session.
  if (role === "host" && !name) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold">{t.qr.title}</h1>
        <NamePrompt
          onSubmit={(value) => {
            storeName(session.token, value);
            setName(value);
          }}
        />
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
          storeName(next.token, name ?? "");
          void navigate({ to: "/s/$token", params: { token: next.token } });
        }}
      />
    );
  }

  if (role === "guest" && !entered) {
    return (
      <GuestWelcome
        session={session}
        initialName={name ?? ""}
        onJoined={(next, chosenName, chosenLang) => {
          setSession(next);
          setName(chosenName);
          setMyLang(chosenLang);
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
      displayName={name ?? ""}
      {...(myLang ? { myLang } : {})}
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
  const guestInvitation = qrInvitation(session.guestLang);

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

        <p
          lang={session.guestLang}
          dir={session.guestLang === "ar" ? "rtl" : "ltr"}
          className="mt-5 rounded-xl border border-border bg-surface p-4 text-base font-medium leading-relaxed"
        >
          {guestInvitation}
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
                  await navigator.share({ title: t.qr.title, text: guestInvitation, url });
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
  initialName,
  onJoined,
}: {
  session: SessionPublic;
  initialName: string;
  onJoined: (s: SessionPublic, name: string, lang: string) => void;
}) {
  const { t, locale } = useI18n();
  const join = useServerFn(joinSessionFn);
  const recorder = useRecorder();

  const [lang, setLang] = useState(session.guestLang);
  useEffect(() => {
    const own = detectBrowserSpoken();
    if (own) setLang(own);
  }, []);
  const [editingLang, setEditingLang] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function enter(name: string) {
    setWorking(true);
    setError(null);
    storeName(session.token, name);

    // Ask for the microphone right away; a refusal still lets them read.
    const micOk = await recorder.requestMic();
    guestMicReady = micOk;

    const res = await join({
      data: {
        token: session.token,
        guestLang: lang,
        clientId: clientId(),
        displayName: name,
        role: "guest",
      },
    });
    setWorking(false);
    if (!res.ok) {
      setError(res.code === "ended" ? t.errors.sessionEnded : t.errors.linkGone);
      return;
    }
    onJoined(res.session, name, lang);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t.join.title}</h1>

      <div className="glass-card mt-6 p-6">
        <p className="text-sm text-muted-foreground">{t.join.chooseYourLang}</p>
        {editingLang ? null : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-2xl font-bold">{languageLabel(findLanguage(lang), locale)}</span>
            <button
              type="button"
              onClick={() => setEditingLang(true)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium"
            >
              {t.create.edit}
            </button>
          </div>
        )}
        {editingLang ? (
          <div className="mt-3">
            <LanguagePicker value={lang} onChange={setLang} />
          </div>
        ) : null}
      </div>

      <NamePrompt
        initial={initialName}
        submitLabel={t.join.joinCta}
        busy={working}
        onSubmit={(value) => void enter(value)}
      />

      <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
        <Mic className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t.join.micText}
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

