import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Clock,
  Keyboard,
  Loader2,
  LogOut,
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
import {
  endSession as endSessionFn,
  listMessages as listMessagesFn,
  sendTextMessage as sendTextMessageFn,
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
  const [error, setError] = useState<FailureCode | "mic_denied" | "mic_unavailable" | "too_short" | null>(
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
      setMessages(res.messages);
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

  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [draft, setDraft] = useState("");

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
      <div className="surface-panel sticky top-16 z-20 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <span className="truncate font-medium">
            {languageLabel(findLanguage(myLang), locale)}
          </span>
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
          <Clock className="size-4" aria-hidden />
          {t.session.expiresIn} {countdown}
        </span>
        {headerOpen ? (
        <>
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-medium">
          <Languages className="size-4" aria-hidden />
          <span className="sr-only">{t.join.chooseYourLang}</span>
          <select
            value={myLang}
            onChange={(e) => setMyLang(e.target.value)}
            aria-label={t.join.chooseYourLang}
            className="bg-transparent outline-none"
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


              {m.state === "error" && !m.originalText ? (
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

      <div className="sticky bottom-0 mt-3 flex flex-col items-center gap-2 bg-background/80 py-2 backdrop-blur-xl">
        <div role="tablist" className="inline-flex rounded-full border border-border bg-surface p-0.5 text-xs">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "voice"}
            onClick={() => setInputMode("voice")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
              inputMode === "voice" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <Mic className="size-4" aria-hidden />
            {t.session.modeVoice}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === "text"}
            onClick={() => setInputMode("text")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium",
              inputMode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <Keyboard className="size-4" aria-hidden />
            {t.session.modeText}
          </button>
        </div>

        {inputMode === "text" ? (
          <form
            className="flex w-full max-w-xl items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendText();
            }}
          >
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
              className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-base outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={t.session.send}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
            </button>
          </form>
        ) : micReady || recorder.micState === "granted" ? (
          <PushToTalk
            recording={recorder.recording}
            busy={busy}
            onStart={handleStart}
            onStop={handleStop}
          />
        ) : (
          <div className="w-full max-w-sm space-y-2 text-center">
            <p className="text-sm text-muted-foreground">{t.join.readOnly}</p>
            <button
              type="button"
              onClick={() => void recorder.requestMic()}
              className="w-full rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 font-semibold text-primary-foreground"
            >
              {t.session.micRequest}
            </button>
          </div>
        )}
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
