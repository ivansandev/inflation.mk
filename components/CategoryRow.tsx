"use client";

import { formatPercent, formatSignedPercent } from "@/lib/format";

const SLIDER_MAX = 50;

export default function CategoryRow({
  code,
  name,
  weight,
  share,
  yoy,
  official,
  locale,
  ariaLabel,
  onChange,
}: {
  code: number;
  name: string;
  weight: number;
  share: number;
  yoy: number | null;
  official: number;
  locale: string;
  ariaLabel: string;
  onChange: (weight: number) => void;
}) {
  // Colour the YoY badge by how this category compares to the headline rate:
  // notably above → "up" (red), notably below → "down" (green), else neutral.
  let yoyColor = "text-muted";
  if (yoy != null) {
    const diff = yoy - official;
    if (diff > 0.75) yoyColor = "text-up";
    else if (diff < -0.75) yoyColor = "text-down";
  }

  const shareText = formatPercent(share, locale, share < 9.95 ? 1 : 0);
  const yoyText = yoy == null ? "—" : formatSignedPercent(yoy, locale);

  return (
    <div className="py-3 sm:grid sm:grid-cols-[2.1rem_minmax(0,1fr)_8rem_3.2rem] sm:items-center sm:gap-x-4">
      <span className="num hidden text-[0.7rem] text-faint sm:block">
        {String(code).padStart(2, "0")}
      </span>

      {/* Name + YoY badge; on mobile the share sits to the right on the same line. */}
      <div className="flex items-baseline justify-between gap-3 sm:block sm:justify-start">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm text-foreground">{name}</span>
          <span className={`num shrink-0 text-xs ${yoyColor}`}>{yoyText}</span>
        </div>
        <span className="num shrink-0 text-sm text-foreground sm:hidden">
          {shareText}
        </span>
      </div>

      <input
        type="range"
        className="slider mt-2.5 w-full sm:mt-0"
        min={0}
        max={SLIDER_MAX}
        step={1}
        value={Math.min(weight, SLIDER_MAX)}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <span className="num hidden text-right text-sm text-foreground sm:block">
        {shareText}
      </span>
    </div>
  );
}
