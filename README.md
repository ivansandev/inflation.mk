# inflation.mk

A personalized inflation calculator for North Macedonia. The official Consumer
Price Index uses a single national-average basket where **food alone is ~40%** —
which rarely matches how any individual actually lives. This app lets you compose
**your own basket** across the official spending categories and see **your personal
year-over-year inflation** next to the official rate.

Trilingual: **Македонски** (default), **English**, **Shqip**.

## Data

All figures come from the official **State Statistical Office of the Republic of
North Macedonia** (Државен завод за статистика), via the open
[MakStat PXWeb API](https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Ceni__IndeksTrosZivot__TrosociZivot/):

- Consumer Price Index by **ECOICOP version 2** (13 divisions), monthly, latest
  year-over-year — table `121_CeniTr_Mk_IndTroZi_ecoicop_ml.px`.
- Official **CPI weight structure** — table `132_CeniTr_Mk_Ponderi_ml.px`.

Data is fetched live and cached for 24h. If the official API is unreachable, the
app falls back to a bundled snapshot (`data/cpi-snapshot.json`).

> **Source: State Statistical Office of the Republic of North Macedonia.**
> Independent project, not affiliated with the State Statistical Office.

## How the number is computed

Personal inflation is the weighted average of each category's official
year-over-year price change, using your basket weights:

```
personalRate% = ( Σ(weightᵢ · indexᵢ) / Σ(weightᵢ) ) − 100
```

The default basket follows a **75% essentials / 25% quality-of-life** split.
"Use official weights" loads the national CPI weights, which reproduces the
official headline rate.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

Refresh the bundled offline fallback from the live API:

```bash
node scripts/make-snapshot.mjs
```

## Build & self-host

The app builds to a standalone Node server (`output: "standalone"`).

```bash
npm run build
node .next/standalone/server.js     # serves on PORT (default 3000)
```

### Docker

```bash
docker build -t inflation-mk .
docker run -p 3000:3000 inflation-mk
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
[next-intl](https://next-intl.dev) for i18n · [Geist](https://vercel.com/font)
(self-hosted, full Cyrillic + Latin coverage).
