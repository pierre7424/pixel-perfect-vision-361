import { Check, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { SPOKEN_LANGUAGES } from "@/lib/languages";
import { languageLabel, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguagePicker({
  value,
  onChange,
  labelledBy,
}: {
  value: string | null;
  onChange: (code: string) => void;
  labelledBy?: string;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPOKEN_LANGUAGES;
    return SPOKEN_LANGUAGES.filter((l) =>
      [l.native, l.fr, l.en, l.zh, l.code].some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);

  const selected = SPOKEN_LANGUAGES.find((l) => l.code === value);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.create.searchPlaceholder}
          aria-label={t.create.searchPlaceholder}
          className="w-full rounded-xl border border-input bg-surface py-3 pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <ul
        aria-labelledby={labelledBy}
        className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-surface/60 p-1.5"
      >
        {results.map((lang) => {
          const active = lang.code === value;
          return (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => onChange(lang.code)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  active
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/50"
                    : "hover:bg-secondary/60",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium">
                    {languageLabel(lang, locale)}
                  </span>
                  <span className="text-xs text-muted-foreground">{lang.code}</span>
                </span>
                {lang.limited ? (
                  <TriangleAlert className="size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
                {active ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {selected?.limited ? (
        <p className="flex gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{t.create.limitedWarning}</span>
        </p>
      ) : null}
    </div>
  );
}
