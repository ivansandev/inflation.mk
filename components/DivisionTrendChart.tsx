"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Apple,
  Car,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Ticket,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import type { DivisionPoint } from "@/lib/inflation";
import { formatSignedPercent, monthLabel } from "@/lib/format";

// Maps a division's `icon` name (lib/divisions.ts) to its lucide glyph.
const ICONS: Record<string, LucideIcon> = {
  Apple,
  Wine,
  Shirt,
  House,
  Sofa,
  HeartPulse,
  Car,
  Smartphone,
  Ticket,
  GraduationCap,
  UtensilsCrossed,
  Landmark,
  Sparkles,
};

// Same fixed-box-scaled-by-viewBox approach as InflationChart, but compact: one
// of many small multiples. Strokes are non-scaling so lines stay crisp at any
// tile size. Text lives in HTML, not SVG, for legibility and locale-safety.
const VIEW_W = 240;
const VIEW_H = 88;

/** A "nice" tick step (…1, 2, 5, 10…) for a value range and target tick count. */
function niceStep(range: number, target: number): number {
  const raw = Math.max(range, 1) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

export default function DivisionTrendChart({
  points,
  name,
  icon,
  locale,
}: {
  points: DivisionPoint[];
  name: string;
  icon: string;
  locale: string;
}) {
  const t = useTranslations();
  const plotRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const n = points.length;
  if (n < 2) return null;

  // Each tile autoscales to its own range (division ranges vary ~10×, so a shared
  // scale would flatten the calm divisions), always anchored at the 0% baseline
  // and including the official line, snapped to nice round bounds.
  const values = points.flatMap((p) => [p.value, p.official]);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(1, ...values);
  const step = niceStep(rawMax - rawMin, 3);
  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(rawMax / step) * step;

  const fx = (i: number) => i / (n - 1); // 0..1 left→right
  const fy = (v: number) => (yMax - v) / (yMax - yMin); // 0..1 top→bottom
  const X = (i: number) => +(fx(i) * VIEW_W).toFixed(2);
  const Y = (v: number) => +(fy(v) * VIEW_H).toFixed(2);

  const line = (sel: (p: DivisionPoint) => number) =>
    points.map((p, i) => `${X(i)},${Y(sel(p))}`).join(" ");
  const valuePts = line((p) => p.value);
  const officialPts = line((p) => p.official);

  const last = points[n - 1];

  // Colour the latest figure by how this division compares to the headline rate:
  // notably above → "up" (red), notably below → "down" (green), else neutral.
  // Same rule the calculator uses for category badges (CategoryRow).
  const diff = last.value - last.official;
  let yoyColor = "text-muted";
  if (diff > 0.75) yoyColor = "text-up";
  else if (diff < -0.75) yoyColor = "text-down";

  const onMove = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = (clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  };

  const hp = hover != null ? points[hover] : null;
  const showZero = yMin < 0 && yMax > 0;
  const Icon = ICONS[icon] ?? Sparkles;

  return (
    <figure
      className="rounded-xl border border-line p-4"
      role="img"
      aria-label={`${name} ${formatSignedPercent(last.value, locale)}, ${t(
        "hero.officialLabel",
      )} ${formatSignedPercent(last.official, locale)}`}
    >
      <figcaption className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="truncate text-sm text-foreground">{name}</span>
        </span>
        <span className={`num shrink-0 text-sm font-semibold ${yoyColor}`}>
          {formatSignedPercent(last.value, locale)}
        </span>
      </figcaption>

      <div
        ref={plotRef}
        className="relative mt-3 touch-pan-y"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-auto w-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* 0% baseline */}
          {showZero && (
            <line
              x1={0}
              x2={VIEW_W}
              y1={Y(0)}
              y2={Y(0)}
              vectorEffect="non-scaling-stroke"
              className="text-line-strong"
              stroke="currentColor"
              strokeWidth={1}
            />
          )}

          {/* Official — muted, dashed */}
          <polyline
            points={officialPts}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeDasharray="4 3"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="text-faint"
          />
          {/* Division — strong, solid */}
          <polyline
            points={valuePts}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="text-foreground"
          />

          {/* Hover guide + dots */}
          {hp && (
            <g>
              <line
                x1={X(hover!)}
                x2={X(hover!)}
                y1={0}
                y2={VIEW_H}
                vectorEffect="non-scaling-stroke"
                className="text-line-strong"
                stroke="currentColor"
                strokeWidth={1}
              />
              <circle
                cx={X(hover!)}
                cy={Y(hp.official)}
                r={3}
                className="text-faint"
                fill="currentColor"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={X(hover!)}
                cy={Y(hp.value)}
                r={3.5}
                className="text-foreground"
                fill="currentColor"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hp && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max rounded-lg border border-line-strong bg-surface-2 px-2.5 py-1.5 text-xs shadow-sm"
            style={{
              left: `${fx(hover!) * 100}%`,
              transform:
                fx(hover!) < 0.2
                  ? "translateX(0)"
                  : fx(hover!) > 0.8
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
            }}
          >
            <div className="mb-1 text-faint">{monthLabel(hp.month, t)}</div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                {name}
              </span>
              <span className="num text-foreground">
                {formatSignedPercent(hp.value, locale)}
              </span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <span className="h-0 w-3 border-t border-dashed border-faint" />
                {t("hero.officialLabel")}
              </span>
              <span className="num text-muted">
                {formatSignedPercent(hp.official, locale)}
              </span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
