import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { getJoinCode as getJoinCodeFn } from "@/lib/conversation.functions";
import { useI18n } from "@/lib/i18n";

const L: Record<string, { title: string; valid: string; expired: string; renew: string; where: string }> = {
  fr: { title: "Code de session", valid: "Valable encore", expired: "Code expiré", renew: "Nouveau code", where: "À saisir dans « Rejoindre une conversation »." },
  en: { title: "Session code", valid: "Valid for", expired: "Code expired", renew: "New code", where: "Enter it in “Join a conversation”." },
  zh: { title: "對話代碼", valid: "剩餘有效", expired: "代碼已過期", renew: "產生新代碼", where: "在「加入對話」中輸入。" },
};

/** Shows the 5-digit join code (valid 1 h) with a renew button. */
export function JoinCode({ token }: { token: string }) {
  const { locale } = useI18n();
  const T = L[locale] ?? L["en"]!;
  const getCode = useServerFn(getJoinCodeFn);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (renew: boolean) => {
      setBusy(true);
      try {
        const res = await getCode({ data: { token, renew } });
        if (res.ok) {
          setCode(res.code);
          setExpiresAt(new Date(res.expiresAt).getTime());
        }
      } finally {
        setBusy(false);
      }
    },
    [getCode, token],
  );

  useEffect(() => {
    void load(false);
  }, [load]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, expiresAt - now);
  const expired = code != null && left === 0;
  const mm = Math.floor(left / 60_000);
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, "0");

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{T.title}</p>
      <p
        className={`mt-1 font-mono text-4xl font-bold tracking-[0.3em] ${expired ? "text-muted-foreground line-through" : "text-foreground"}`}
        aria-live="polite"
      >
        {code ?? "·····"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {expired ? T.expired : code ? `${T.valid} ${mm}:${ss}` : ""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{T.where}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void load(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} aria-hidden />
        {T.renew}
      </button>
    </div>
  );
}
