import { Link } from "@tanstack/react-router";
import { Globe, Sparkles } from "lucide-react";

import { UI_LOCALES, useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { t, locale, setLocale, reduceMotion, setReduceMotion } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-base font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <span>{t.brand}</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 accent-[color:var(--primary)]"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
            />
            <span className="hidden sm:inline">{t.nav.reduceMotion}</span>
            <span className="sm:hidden">⏸</span>
          </label>

          <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1">
            <Globe className="size-3.5 text-muted-foreground" aria-hidden />
            <label className="sr-only" htmlFor="ui-locale">
              {t.nav.interfaceLanguage}
            </label>
            <select
              id="ui-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              className="bg-transparent text-xs font-medium text-foreground outline-none"
            >
              {UI_LOCALES.map((l) => (
                <option key={l.code} value={l.code} className="bg-popover text-popover-foreground">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-border/70 py-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted-foreground">
        <span>{t.brand}</span>
        <nav className="flex gap-5">
          <Link to="/confidentialite" className="underline-offset-4 hover:text-foreground hover:underline">
            {t.nav.privacy}
          </Link>
          <Link to="/accessibilite" className="underline-offset-4 hover:text-foreground hover:underline">
            {t.nav.accessibility}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
