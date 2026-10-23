import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  LogOut,
  ImagePlus,
  Infinity as InfinityIcon,
  Mic,
  QrCode,
  Send,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PushToTalk } from "@/components/push-to-talk";
import { QrModal } from "@/components/qr-modal";
import { clientId } from "@/lib/identity";
import { markSessionRead } from "@/lib/recent-sessions";
import { languageLabel, useI18n } from "@/lib/i18n";
import { SPOKEN_LANGUAGES, findLanguage } from "@/lib/languages";
import { Languages } from "lucide-react";
import {
  enableNotificationsByDefault,
  isEmbedded,
  notifyMessage,
  requestNotifications,
  type NotifyStatus,
} from "@/lib/notify";

import { useRecorder } from "@/lib/use-recorder";
import { supabase } from "@/integrations/supabase/client";
import {
  endSession as endSessionFn,
  listMessages as listMessagesFn,
  sendTextMessage as sendTextMessageFn,
  createMediaUpload as createMediaUploadFn,
  sendMediaMessage as sendMediaMessageFn,
  sendUtterance as sendUtteranceFn,
  type FailureCode,
  type MessagePublic,
  type ParticipantPublic,
  type Role,
  type SessionPublic,
} from "@/lib/conversation.functions";
import { cn } from "@/lib/utils";


function useCountdown(iso: string) {
  const [left, setLeft] = useState(() => new Date(iso).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(new Date(iso).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [iso]);
  const total = Math.max(0, Math.floor(left / 1000));
  const days = Math.floor(total / 86400);
  if (days > 0) return `${days} j ${Math.floor((total % 86400) / 3600)} h`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, "0")}`;
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function ConversationView({
  role,
  initialSession,
  micReady,
  displayName,
  myLang: myLangProp,
}: {
  role: Role;
  initialSession: SessionPublic;
  micReady: boolean;
  displayName: string;
  myLang?: string;
}) {
  const { t, locale } = useI18n();
  const [session, setSession] = useState(initialSession);
  const [messages, setMessages] = useState<MessagePublic[]>([]);
  const [participants, setParticipants] = useState<ParticipantPublic[]>([]);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [error, setError] = useState<FailureCode | "mic_denied" | "mic_unavailable" | "too_short" | "media_too_big" | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const [notifState, setNotifState] = useState<NotifyStatus>("default");
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const labels = useRef({ newMessage: "New message", partner: "Partner" });
  labels.current = { newMessage: t.session.newMessage, partner: t.session.partner };

  const [notifHint, setNotifHint] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);

  // Notifications are on by default: ask as soon as the conversation opens.
  useEffect(() => enableNotificationsByDefault(setNotifState), []);


  const listMessages = useServerFn(listMessagesFn);
  const sendUtterance = useServerFn(sendUtteranceFn);
  const sendText = useServerFn(sendTextMessageFn);
  const endSession = useServerFn(endSessionFn);
  const recorder = useRecorder();

  const countdown = useCountdown(session.expiresAt);
  const [myLang, setMyLangState] = useState(
    myLangProp ?? (role === "host" ? session.hostLang : session.guestLang),
  );
  useEffect(() => {
    const saved = window.localStorage.getItem(`lang-${session.token}`);
    if (saved && findLanguage(saved)) setMyLangState(saved);
  }, [session.token]);
  const setMyLang = (code: string) => {
    window.localStorage.setItem(`lang-${session.token}`, code);
    setMyLangState(code);
  };

  const refresh = useCallback(async () => {
    try {
      const res = await listMessages({
        data: {
          token: session.token,
          clientId: clientId(),
          displayName,
          role,
          lang: myLang,
        },
      });
      setOnline(true);
      if (!res.ok) {
        setError(res.code);
        return;
      }
      setSession(res.session);
      // Keep the first media link per message so playing videos are not reset on each poll.
      setMessages((prev) => {
        const known = new Map(prev.map((p) => [p.id, p.mediaUrl]));
        return res.messages.map((m) => {
          const old = known.get(m.id);
          return old && m.mediaUrl ? { ...m, mediaUrl: old } : m;
        });
      });
      markSessionRead(session.token);
      setParticipants(res.participants);

      // Notify about messages from other people while the page is in the background.
      const fresh = res.messages.filter((m) => !seenIds.current.has(m.id));
      res.messages.forEach((m) => seenIds.current.add(m.id));
      if (primed.current) {
        const fromOthers = fresh.filter((m) => (m.displayName ?? "") !== displayName);
        const latest = fromOthers[fromOthers.length - 1];
        if (latest) {
          notifyMessage(
            `${latest.displayName ?? labels.current.partner} — ${labels.current.newMessage}`,
            latest.translatedText ?? latest.originalText ?? "",
          );
        }
      }
      primed.current = true;
    } catch {
      setOnline(false);
    }
  }, [listMessages, session.token, displayName, role, myLang]);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleStart = useCallback(async () => {
    setError(null);
    const ok = await recorder.start();
    if (!ok) {
      setError(recorder.micState === "unavailable" ? "mic_unavailable" : "mic_denied");
    }
  }, [recorder]);

  const handleStop = useCallback(async () => {
    const clip = await recorder.stop();
    if (!clip) {
      if (recorder.recording) setError("too_short");
      return;
    }
    setBusy(true);
    try {
      const res = await sendUtterance({
        data: {
          token: session.token,
          role,
          audioBase64: clip.base64,
          mimeType: clip.mimeType,
          clientId: clientId(),
          displayName,
        },
      });
      if (!res.ok) {
        setError(res.code);
      } else {
        setMessages((prev) => [...prev, res.message]);
      }
      setOnline(true);
    } catch {
      setOnline(false);
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }, [recorder, role, sendUtterance, session.token, displayName]);

  const [draft, setDraft] = useState("");
  const createUpload = useServerFn(createMediaUploadFn);
  const sendMedia = useServerFn(sendMediaMessageFn);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      const mediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
      if (!mediaType) return;
      if (file.size > 50 * 1024 * 1024) {
        setError("media_too_big");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const ext = (file.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg"))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 5) || "bin";
        const up = await createUpload({ data: { token: session.token, ext } });
        if (!up.ok) throw new Error(up.code);
        const { error: e } = await supabase.storage
          .from("chat-media")
          .uploadToSignedUrl(up.path, up.uploadToken, file, { contentType: file.type });
        if (e) throw e;
        const res = await sendMedia({
          data: { token: session.token, role, path: up.path, mediaType, clientId: clientId(), displayName },
        });
        if (!res.ok) throw new Error(res.code);
        await refresh();
      } catch {
        setError("unavailable");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [createUpload, sendMedia, session.token, role, displayName, refresh],
  );

  const handleSendText = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await sendText({
        data: { token: session.token, role, text, clientId: clientId(), displayName },
      });
      if (!res.ok) {
        setError(res.code);
      } else {
        setDraft("");
        setMessages((prev) => [...prev, res.message]);
      }
      setOnline(true);
    } catch {
      setOnline(false);
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }, [draft, busy, sendText, session.token, role, displayName]);



  const errorText = (() => {
    switch (error) {
      case null:
        return null;
      case "media_too_big":
        return MEDIA_L[locale]?.tooBig ?? MEDIA_EN.tooBig;
      case "mic_denied":
        return t.errors.micDenied;
      case "mic_unavailable":
        return t.errors.micUnavailable;
      case "too_short":
        return t.errors.tooShort;
      case "transcription_failed":
        return t.errors.transcriptionFailed;
      case "translation_failed":
        return t.errors.translationFailed;
      case "rate_limited":
      case "unavailable":
        return t.errors.network;
      case "expired":
      case "revoked":
        return t.errors.linkGone;
      case "ended":
        return t.errors.sessionEnded;
      default:
        return t.errors.generic;
    }
  })();

  if (session.status === "ended") {
    return (
      <div className="glass-card mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold">{t.session.ended}</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 font-semibold text-primary-foreground"
        >
          {t.errors.backHome}
        </Link>
      </div>
    );
  }

  const peopleCount = Math.max(1, participants.length);

  return (

    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 pb-6">
      {session.name ? <h1 className="mt-4 truncate text-xl font-bold">{session.name}</h1> : null}
      <div className="surface-panel sticky top-16 z-20 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <label className="inline-flex min-w-0 items-center gap-1.5 justify-self-start rounded-lg border border-border bg-surface px-3 py-1.5 font-medium">
            <Languages className="size-4 shrink-0" aria-hidden />
            <select
              value={myLang}
              onChange={(e) => setMyLang(e.target.value)}
              aria-label={t.join.chooseYourLang}
              className="min-w-0 truncate bg-transparent outline-none"
            >
              {SPOKEN_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-background text-foreground">
                  {languageLabel(l, locale)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setHeaderOpen((v) => !v)}
            aria-expanded={headerOpen}
            aria-label={headerOpen ? t.session.collapse : t.session.expand}
            title={headerOpen ? t.session.collapse : t.session.expand}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface"
          >
            {headerOpen ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
          </button>
        </div>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {online ? <Wifi className="size-4" aria-hidden /> : <WifiOff className="size-4" aria-hidden />}
          {online ? t.session.connected : t.session.reconnecting}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {session.unlimited ? (
            <>
              <InfinityIcon className="size-4" aria-hidden />
              {MEDIA_L[locale]?.permanent ?? MEDIA_EN.permanent}
            </>
          ) : (
            <>
              <Clock className="size-4" aria-hidden />
              {t.session.expiresIn} {countdown}
            </>
          )}
        </span>
        {headerOpen ? (
        <>


        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          aria-expanded={showPeople}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium"
        >
          <Users className="size-4" aria-hidden />
          {peopleCount} {peopleCount > 1 ? t.session.present : t.session.presentOne}
        </button>

        {notifState !== "unsupported" ? (
          <button
            type="button"
            onClick={async () => {
              setNotifHint(false);
              if (isEmbedded()) {
                window.open(window.location.href, "_blank", "noopener");
                return;
              }
              if (notifState === "denied") {
                setNotifHint(true);
                return;
              }
              if (notifState === "granted") return;
              const next = await requestNotifications();
              setNotifState(next);
              if (next !== "granted") setNotifHint(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium"
          >
            {notifState === "granted" ? (
              <Bell className="size-4" aria-hidden />
            ) : (
              <BellOff className="size-4" aria-hidden />
            )}
            {notifState === "granted"
              ? t.session.notifyOn
              : notifState === "denied"
                ? t.session.notifyDenied
                : notifState === "in-iframe"
                  ? t.session.notifyTab
                  : t.session.notify}
          </button>
        ) : null}


        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium"
        >
          <QrCode className="size-4" aria-hidden />
          {t.session.showQr}
        </button>
        <button
          type="button"
          onClick={async () => {
            await endSession({ data: { token: session.token } });
            setSession((s) => ({ ...s, status: "ended" }));
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-1.5 font-medium text-destructive"
        >
          <LogOut className="size-4" aria-hidden />
          {role === "host" ? t.session.end : t.join.leave}
        </button>
        </>
        ) : null}
      </div>


      {notifHint ? (
        <p role="status" className="surface-panel mt-2 px-4 py-3 text-sm text-muted-foreground">
          {t.session.notifyHelp}
        </p>
      ) : null}


      {showPeople ? (
        <ul className="surface-panel mt-2 space-y-1 px-4 py-3 text-sm">
          <li className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.session.participants}
          </li>
          {participants.map((p) => (
            <li key={p.clientId} className="flex items-center justify-between gap-3">
              <span className="font-medium">{p.displayName}</span>
              <span className="text-muted-foreground">
                {languageLabel(findLanguage(p.lang), locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">{t.session.assistedNote}</p>


      <div
        className="mt-3 flex-1 space-y-3"
        aria-live="polite"
        aria-relevant="additions text"
        role="log"
      >
        {messages.length === 0 ? (
          <p className="surface-panel p-6 text-center text-muted-foreground">{t.session.empty}</p>
        ) : null}

        {messages.map((m) => {
          const mine = m.speaker === role && (m.displayName ?? "") === displayName;
          const sameLang = m.sourceLang === myLang;
          const myText = m.translations?.[myLang] ?? (m.targetLang === myLang ? m.translatedText : null);
          const shownText = sameLang ? null : (myText ?? m.translatedText);
          const shownLang = myText ? myLang : m.targetLang;
          return (
            <article
              key={m.id}
              className={cn(
                "animate-rise max-w-[88%] rounded-2xl border p-4",
                mine
                  ? "ml-auto border-primary/40 bg-primary/10"
                  : "mr-auto border-border bg-surface",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {m.displayName ?? (mine ? t.session.you : t.session.partner)}
                {mine ? ` · ${t.session.you}` : ""}
              </p>


              {m.mediaType ? (
                m.mediaUrl ? (
                  m.mediaType === "video" ? (
                    <div className="mt-2">
                      <video src={m.mediaUrl} controls playsInline preload="metadata" className="max-h-96 w-full rounded-xl bg-background" />
                      <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-muted-foreground underline">
                        ▶ Ouvrir la vidéo / Open video
                      </a>
                    </div>
                  ) : (
                    <a href={m.mediaUrl} target="_blank" rel="noreferrer">
                      <img src={m.mediaUrl} alt="" loading="lazy" className="mt-2 max-h-96 w-full rounded-xl object-cover" />
                    </a>
                  )
                ) : null
              ) : m.state === "error" && !m.originalText ? (
                <p className="mt-2 flex gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t.errors.transcriptionFailed}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-base leading-relaxed">{m.originalText}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t.session.original} · {m.sourceLang}
                  </p>

                  {sameLang ? null : shownText ? (
                    <>
                      <p className="mt-3 border-t border-border/70 pt-3 text-lg font-medium leading-relaxed">
                        {shownText}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {t.session.translation} · {shownLang}
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 flex gap-2 border-t border-border/70 pt-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {t.errors.translationFailed}
                    </p>
                  )}
                </>
              )}
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {errorText ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm"
        >
          <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden />
          <span className="flex-1">{errorText}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-lg border border-border px-3 py-1.5 font-medium"
          >
            {t.session.retry}
          </button>
        </div>
      ) : null}

      <div className="sticky bottom-0 mt-3 bg-background/80 py-2 backdrop-blur-xl">
        {recorder.recording ? (
          <p aria-live="polite" className="mb-1 text-center text-xs font-medium text-primary">
            {t.session.releaseToSend}
          </p>
        ) : null}
        <form
          className="mx-auto flex w-full max-w-xl items-end gap-2 rounded-3xl border border-border bg-surface p-1.5 pl-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendText();
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label={MEDIA_L[locale]?.add ?? MEDIA_EN.add}
            title={MEDIA_L[locale]?.add ?? MEDIA_EN.add}
            className="-ml-1.5 grid size-10 shrink-0 place-items-center self-end rounded-full text-muted-foreground disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendText();
              }
            }}
            rows={1}
            maxLength={2000}
            aria-label={t.session.typePlaceholder}
            placeholder={t.session.typePlaceholder}
            className="min-h-10 flex-1 resize-none bg-transparent py-2 text-base outline-none"
          />
          {draft.trim() ? (
            <button
              type="submit"
              disabled={busy}
              aria-label={t.session.send}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
            </button>
          ) : micReady || recorder.micState === "granted" ? (
            <PushToTalk
              compact
              recording={recorder.recording}
              busy={busy}
              onStart={handleStart}
              onStop={handleStop}
            />
          ) : (
            <button
              type="button"
              onClick={() => void recorder.requestMic()}
              aria-label={t.session.micRequest}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground"
            >
              <Mic className="size-5" aria-hidden />
            </button>
          )}
        </form>
      </div>


      {showQr ? (
        <QrModal
          token={session.token}
          guestLang={session.guestLang}
          onClose={() => setShowQr(false)}
        />
      ) : null}
    </div>
  );
}

type MediaL = { add: string; permanent: string; tooBig: string };
const MEDIA_EN: MediaL = { add: "Add a photo or video", permanent: "No time limit", tooBig: "File too large (50 MB max)." };
const MEDIA_L: Record<string, MediaL> = {
  fr: { add: "Ajouter une photo ou vidéo", permanent: "Sans limite de temps", tooBig: "Fichier trop lourd (50 Mo max)." },
  en: { add: "Add a photo or video", permanent: "No time limit", tooBig: "File too large (50 MB max)." },
  zh: { add: "新增照片或影片", permanent: "無時間限制", tooBig: "檔案太大（最多 50 MB）。" },
};
