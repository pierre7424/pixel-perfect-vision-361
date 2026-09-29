import { Loader2, Mic } from "lucide-react";
import { useRef } from "react";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PushToTalk({
  recording,
  busy,
  disabled,
  onStart,
  onStop,
}: {
  recording: boolean;
  busy: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const { t } = useI18n();
  const keyDownRef = useRef(false);

  const label = busy ? t.session.processing : recording ? t.session.releaseToSend : t.session.holdToTalk;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled || busy}
        aria-label={label}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          onStart();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          onStop();
        }}
        onPointerCancel={() => onStop()}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !keyDownRef.current) {
            e.preventDefault();
            keyDownRef.current = true;
            onStart();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            keyDownRef.current = false;
            onStop();
          }
        }}
        className={cn(
          "grid size-24 touch-none select-none place-items-center rounded-full transition-transform",
          "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)]",
          recording && "scale-110 animate-pulse-ring",
          (disabled || busy) && "opacity-50",
        )}
      >
        {busy ? (
          <Loader2 className="size-9 animate-spin" aria-hidden />
        ) : (
          <Mic className="size-9" aria-hidden />
        )}
      </button>
      <p aria-live="polite" className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
