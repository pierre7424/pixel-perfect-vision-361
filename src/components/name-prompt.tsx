import { useState } from "react";

import { useI18n } from "@/lib/i18n";

/** Asks every participant for the pseudo shown next to their messages. */
export function NamePrompt({
  initial,
  submitLabel,
  onSubmit,
  busy,
}: {
  initial?: string;
  submitLabel?: string;
  onSubmit: (name: string) => void;
  busy?: boolean;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial ?? "");
  const trimmed = name.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed) return;
        onSubmit(trimmed.slice(0, 40));
      }}
      className="glass-card mt-4 p-6"
    >
      <h2 className="text-lg font-semibold">{t.join.nameTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.join.nameNote}</p>

      <label htmlFor="pseudo" className="mt-4 block text-sm font-medium">
        {t.join.nameLabel}
      </label>
      <input
        id="pseudo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        autoComplete="nickname"
        placeholder={t.join.namePlaceholder}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      <button
        type="submit"
        disabled={!trimmed || busy}
        className="mt-4 w-full rounded-xl bg-[image:var(--gradient-primary)] px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {submitLabel ?? t.join.nameContinue}
      </button>
    </form>
  );
}
