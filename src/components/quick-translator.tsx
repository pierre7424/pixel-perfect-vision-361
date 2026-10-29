import { ArrowLeftRight, Download, Loader2, Trash2, WifiOff, Check } from "lucide-react";
import { useEffect, useState } from "react";

import { SPOKEN_LANGUAGES, detectBrowserSpoken } from "@/lib/languages";
import { languageLabel, useI18n } from "@/lib/i18n";
import { quickTranslate } from "@/lib/translator.functions";
import {
  deletePack,
  downloadPack,
  downloadedPacks,
  mlKitCode,
  offlineSupported,
  translateOffline,
} from "@/lib/offline-packs";

const L = {
  fr: {
    title: "Traducteur rapide",
    placeholder: "Tapez un texte à traduire…",
    translate: "Traduire",
    swap: "Inverser les langues",
    packs: "Langues hors connexion",
    packsWeb: "Dans l'application mobile, téléchargez des langues pour traduire sans internet.",
    download: "Télécharger",
    remove: "Supprimer",
    offline: "Traduit hors connexion",
    error: "Traduction impossible pour le moment. Réessayez.",
    noPack: "Pas de pack hors connexion",
  },
  en: {
    title: "Quick translator",
    placeholder: "Type text to translate…",
    translate: "Translate",
    swap: "Swap languages",
    packs: "Offline languages",
    packsWeb: "In the mobile app, download languages to translate without internet.",
    download: "Download",
    remove: "Remove",
    offline: "Translated offline",
    error: "Translation unavailable right now. Try again.",
    noPack: "No offline pack",
  },
  zh: {
    title: "快速翻譯",
    placeholder: "輸入要翻譯的文字…",
    translate: "翻譯",
    swap: "交換語言",
    packs: "離線語言",
    packsWeb: "在手機應用程式中，可下載語言以在無網路時翻譯。",
    download: "下載",
    remove: "刪除",
    offline: "已離線翻譯",
    error: "目前無法翻譯，請再試一次。",
    noPack: "無離線語言包",
  },
};

export function QuickTranslator() {
  const { locale } = useI18n();
  const t = L[(locale as keyof typeof L)] ?? L.en;
  const [from, setFrom] = useState("fr");
  const [to, setTo] = useState("en");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [wasOffline, setWasOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [native, setNative] = useState(false);
  const [packs, setPacks] = useState<string[]>([]);
  const [packBusy, setPackBusy] = useState<string | null>(null);

  useEffect(() => {
    const mine = detectBrowserSpoken();
    if (mine) {
      setFrom(mine);
      setTo(mine === "en" ? "fr" : "en");
    }
    const ok = offlineSupported();
    setNative(ok);
    if (ok) void downloadedPacks().then(setPacks);
  }, []);

  async function run() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(false);
    try {
      const off = await translateOffline(text, from, to).catch(() => null);
      if (off) {
        setResult(off);
        setWasOffline(true);
        return;
      }
      const res = await quickTranslate({ data: { text, from, to } });
      if (res.ok) {
        setResult(res.text);
        setWasOffline(false);
      } else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function togglePack(code: string, has: boolean) {
    setPackBusy(code);
    try {
      if (has) await deletePack(code);
      else await downloadPack(code);
      setPacks(await downloadedPacks());
    } catch {
      /* ignore */
    } finally {
      setPackBusy(null);
    }
  }

  const select = (value: string, onChange: (v: string) => void, label: string) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-0 flex-1 rounded-xl border border-input bg-surface px-3 py-2.5 text-sm"
    >
      {SPOKEN_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {languageLabel(l, locale)}
        </option>
      ))}
    </select>
  );

  return (
    <section className="glass-card mx-auto mt-10 max-w-xl p-5 text-left">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      <div className="mt-4 flex items-center gap-2">
        {select(from, setFrom, "from")}
        <button
          type="button"
          aria-label={t.swap}
          onClick={() => {
            setFrom(to);
            setTo(from);
            if (result) {
              setText(result);
              setResult(text);
            }
          }}
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface hover:bg-secondary"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
        </button>
        {select(to, setTo, "to")}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.placeholder}
        rows={3}
        maxLength={2000}
        className="mt-3 w-full resize-none rounded-xl border border-input bg-surface p-3 text-base"
      />
      <button
        type="button"
        onClick={run}
        disabled={busy || !text.trim()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] py-3 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {t.translate}
      </button>
      {error ? <p className="mt-3 text-sm text-destructive">{t.error}</p> : null}
      {result ? (
        <div className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
          <p className="text-lg font-medium">{result}</p>
          {wasOffline ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <WifiOff className="size-3" aria-hidden /> {t.offline}
            </p>
          ) : null}
        </div>
      ) : null}

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold">{t.packs}</summary>
        {!native ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.packsWeb}</p>
        ) : (
          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {SPOKEN_LANGUAGES.map((l) => {
              const c = mlKitCode(l.code);
              const has = !!c && packs.includes(c);
              return (
                <li key={l.code} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    {has ? <Check className="size-4 text-primary" aria-hidden /> : null}
                    {languageLabel(l, locale)}
                  </span>
                  {!c ? (
                    <span className="text-xs text-muted-foreground">{t.noPack}</span>
                  ) : (
                    <button
                      type="button"
                      disabled={packBusy !== null}
                      onClick={() => togglePack(l.code, has)}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                    >
                      {packBusy === l.code ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                      ) : has ? (
                        <Trash2 className="size-3" aria-hidden />
                      ) : (
                        <Download className="size-3" aria-hidden />
                      )}
                      {has ? t.remove : t.download}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </section>
  );
}
