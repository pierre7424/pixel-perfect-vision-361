import QRCode from "qrcode";
import { Check, Copy, Loader2, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { JoinCode } from "@/components/join-code";


import { useI18n } from "@/lib/i18n";
import { qrInvitation } from "@/lib/languages";
import { shareLink } from "@/lib/share-origin";

/** Modal showing the session QR so extra guests can join mid-conversation. */
export function QrModal({
  token,
  guestLang,
  onClose,
}: {
  token: string;
  guestLang: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const url = shareLink(token);
  const invitation = qrInvitation(guestLang);

  useEffect(() => {
    void QRCode.toDataURL(url, {
      width: 520,
      margin: 1,
      color: { dark: "#0b1a20", light: "#ffffff" },
    }).then(setQr);
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.session.showQr}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.session.showQr}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg border border-border p-2"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3">
          {qr ? (
            <img src={qr} alt={t.qr.short} className="size-52" />
          ) : (
            <div className="grid size-52 place-items-center">
              <Loader2 className="size-6 animate-spin text-background" aria-hidden />
            </div>
          )}
        </div>

        <p
          lang={guestLang}
          dir={guestLang === "ar" ? "rtl" : "ltr"}
          className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm font-medium leading-relaxed"
        >
          {invitation}
        </p>

        <JoinCode token={token} />

        <button
          type="button"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({ title: t.qr.title, text: invitation, url });
              } catch {
                /* dismissed */
              }
            } else {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-3 font-semibold text-primary-foreground"
        >
          <Share2 className="size-4" aria-hidden />
          {t.qr.share}
        </button>


        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 font-medium"
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? t.qr.copied : t.qr.copy}
        </button>
      </div>
    </div>
  );
}
