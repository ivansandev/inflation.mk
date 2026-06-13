"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { parseMonth, type SeriesPoint } from "@/lib/inflation";
import { formatPercent, formatSignedPercent, monthLabel } from "@/lib/format";

// Plot is drawn in a fixed user-space box and scaled to fit via the viewBox.
// Strokes use vector-effect="non-scaling-stroke" so lines stay crisp at any
// size; all text lives in HTML (not SVG) so it never shrinks below legibility
// and uses the same theme/locale-aware utilities as the rest of the app.
const VIEW_W = 800;
const VIEW_H = 300;

/** A "nice" tick step (…1, 2, 5, 10…) for a value range and target tick count. */
function niceStep(range: number, target: number): number {
  const raw = Math.max(range, 1) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

export default function InflationChart({
  series,
  locale,
  seriesLabel,
  officialLabel,
}: {
  series: SeriesPoint[];
  locale: string;
  /** Label for the solid line (defaults to the personal-inflation eyebrow). */
  seriesLabel?: string;
  /** Label for the dashed reference line (defaults to "Official CPI"). */
  officialLabel?: string;
}) {
  const t = useTranslations();
  const sLabel = seriesLabel ?? t("hero.eyebrow");
  const oLabel = officialLabel ?? t("hero.officialLabel");
  const plotRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const n = series.length;
  if (n < 2) return null;

  // Y domain from both lines, always including the 0% baseline, snapped to nice
  // round tick boundaries.
  const values = series.flatMap((p) => [p.personal, p.official]);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(1, ...values);
  const step = niceStep(rawMax - rawMin, 5);
  const yMin = Math.floor(rawMin / step) * step;
  const yMax = Math.ceil(rawMax / step) * step;
  const decimals = step < 1 ? 1 : 0;

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v / step) * step);

  const fx = (i: number) => i / (n - 1); // 0..1 left→right
  const fy = (v: number) => (yMax - v) / (yMax - yMin); // 0..1 top→bottom
  const X = (i: number) => +(fx(i) * VIEW_W).toFixed(2);
  const Y = (v: number) => +(fy(v) * VIEW_H).toFixed(2);

  const line = (sel: (p: SeriesPoint) => number) =>
    series.map((p, i) => `${X(i)},${Y(sel(p))}`).join(" ");
  const personalPts = line((p) => p.personal);
  const officialPts = line((p) => p.official);

  // Year boundaries (each January), thinned to ~every other year.
  const yearMarks = series
    .map((p, i) => ({ i, ...parseMonth(p.month) }))
    .filter((m) => m.month === 1);
  const xLabels =
    yearMarks.filter((m) => m.year % 2 === 0).length >= 3
      ? yearMarks.filter((m) => m.year % 2 === 0)
      : yearMarks;

  const onMove = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = (clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  };

  const hp = hover != null ? series[hover] : null;
  const last = series[n - 1];

  return (
    <figure
      className="mt-6"
      role="img"
      aria-label={`${sLabel} ${formatSignedPercent(
        last.personal,
        locale,
      )}, ${oLabel} ${formatSignedPercent(last.official, locale)}`}
    >
      {/* Legend */}
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-foreground" />
          {sLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0 w-5 border-t-2 border-dashed border-faint" />
          {oLabel}
        </span>
      </figcaption>

      <div className="flex items-stretch">
        {/* Y-axis labels */}
        <div className="relative w-10 shrink-0">
          {ticks.map((tk) => (
            <span
              key={tk}
              className="num absolute right-2 -translate-y-1/2 text-[0.7rem] text-faint"
              style={{ top: `${fy(tk) * 100}%` }}
            >
              {formatPercent(tk, locale, decimals)}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div
          ref={plotRef}
          className="relative min-w-0 flex-1 touch-pan-y"
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block h-auto w-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Gridlines + emphasized 0% baseline */}
            {ticks.map((tk) => (
              <line
                key={tk}
                x1={0}
                x2={VIEW_W}
                y1={Y(tk)}
                y2={Y(tk)}
                vectorEffect="non-scaling-stroke"
                className={Math.abs(tk) < 1e-9 ? "text-line-strong" : "text-line"}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}

            {/* Official — muted, dashed */}
            <polyline
              points={officialPts}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="text-faint"
            />
            {/* Personal — strong, solid */}
            <polyline
              points={personalPts}
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
                  r={3.5}
                  className="text-faint"
                  fill="currentColor"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={X(hover!)}
                  cy={Y(hp.personal)}
                  r={4}
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
              className="pointer-events-none absolute top-1 z-10 w-max rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-xs shadow-sm"
              style={{
                left: `${fx(hover!) * 100}%`,
                transform:
                  fx(hover!) < 0.15
                    ? "translateX(0)"
                    : fx(hover!) > 0.85
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
              }}
            >
              <div className="mb-1 text-faint">{monthLabel(hp.month, t)}</div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {sLabel}
                </span>
                <span className="num text-foreground">
                  {formatSignedPercent(hp.personal, locale)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-faint" />
                  {oLabel}
                </span>
                <span className="num text-muted">
                  {formatSignedPercent(hp.official, locale)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex">
        <div className="w-10 shrink-0" />
        <div className="relative h-5 min-w-0 flex-1">
          {xLabels.map((m) => (
            <span
              key={m.year}
              className="num absolute -translate-x-1/2 pt-1 text-[0.7rem] text-faint"
              style={{ left: `${fx(m.i) * 100}%` }}
            >
              {m.year}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
