"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { CpiData } from "@/lib/cpi-source.mjs";
import { DIVISIONS } from "@/lib/divisions";
import { divisionSeries, type DivisionPoint } from "@/lib/inflation";
import DivisionTrendChart from "@/components/DivisionTrendChart";

interface Tile {
  key: string;
  icon: string;
  name: string;
  points: DivisionPoint[];
  current: number;
}

export default function CategoryBreakdown({
  data,
  locale,
}: {
  data: CpiData;
  locale: string;
}) {
  const t = useTranslations();

  const tiles = useMemo(() => {
    const months = data.months.slice(-60); // last 5 years

    return DIVISIONS.map((d) => {
      const points = divisionSeries(data, d.key, months);
      const current = points.length ? points[points.length - 1].value : 0;
      return {
        key: d.key,
        icon: d.icon,
        name: t(`divisions.${d.key}`),
        points,
        current,
      } satisfies Tile;
    })
      .filter((tile) => tile.points.length >= 2)
      // Biggest current year-over-year rise first.
      .sort((a, b) => b.current - a.current);
  }, [data, t]);

  return (
    <div>
      {/* Legend */}
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-foreground" />
          {t("breakdown.legendCategory")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0 w-5 border-t-2 border-dashed border-faint" />
          {t("hero.officialLabel")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <DivisionTrendChart
            key={tile.key}
            points={tile.points}
            name={tile.name}
            icon={tile.icon}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
