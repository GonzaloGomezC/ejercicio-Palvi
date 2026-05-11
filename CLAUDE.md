# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a **specification-only repository** — no application code exists yet. Contents:

- [historias-de-usuario-palvi.md](historias-de-usuario-palvi.md) — five user stories (HU-001..HU-005) with full acceptance criteria, business rules, technical design, and edge cases. This is the source of truth for what to build.
- [metrics.json](metrics.json) — the dataset that drives the app. Shape: top-level keys `A | B | C | D`, each `{ metadata: { metrics: MetricMeta[] }, days: DayEntry[] }`. Lives in `/public` once the app is scaffolded.
- `task.pdf` — original assignment brief.

When the app is scaffolded, expected stack: **React + TypeScript + Vite + Recharts + Tailwind** (mandated by HU spec, not yet installed).

## Architecture (target, per spec)

A single-page executive dashboard. Architectural decisions already made in the spec — do not reinvent:

- **State**: a single `useState<'A'|'B'|'C'|'D'>` in `App.tsx` for the active dataset. No context, no Redux/Zustand. The active dataset object is passed as a prop to every component.
- **Data load**: one `fetch('/metrics.json')` in a `useEffect` at app boot. No re-fetching on dataset switch.
- **Computation model**: all KPIs, scores, alerts, funnel stages, and trend colors are derived from the active dataset via **pure functions** (no async, < 50ms). Reuse the same `computeAvg(days, key, from, to)` primitive across HU-002, HU-003, and the sparklines.
- **Rendering**: header (Sales Health Score + 5 area pills) → alerts panel → KPI strip (6 cards) → funnel → sparkline grid (7 charts). Score header + alerts must be above-the-fold at ≥1280px.

## Cross-cutting rules from the spec

These show up in multiple HUs — getting them right once avoids rework:

- **`null` handling**: `null` values in `days[].metrics` are *excluded* from averages and sums, never coerced to 0. Sparklines interpolate interior nulls linearly; null-at-edges is not extrapolated. Yesterday's value being `null` renders as `—` with no delta.
- **Direction-aware deltas**: every metric carries `direction: 'higher_is_better' | 'lower_is_better'` in `metadata.metrics`. The sign of "improvement" flips accordingly — encapsulate this in one helper and use it for KPI delta colors, score normalization, alert triggers, and sparkline trend colors.
- **Divide-by-zero**: `avg30d === 0` → omit that metric's delta-based alert (still allow score-based alert). Win rate denominator 0 → score = 50 (neutral), KPI shows `—`. Funnel stage sum 0 → conversion to next stage shows `—`.
- **"Yesterday"** = the last day present in the active dataset, **not** the real calendar date. The dataset spans 365 historical days.
- **Scoring weights and area mapping** are fixed constants — see HU-002 §"Diseño técnico" for `AREA_WEIGHTS` and `AREA_METRICS`. Win rate is a *calculated* metric (`sum(deals_won)/sum(deals_won+deals_lost)` over a window), not a JSON field.
- **Alert triggers**: a metric alerts if EITHER its 7d-vs-30d delta exceeds 20% in the bad direction OR its area's score is < 50. The score-only path matters — don't drop it. Show max 3, indicate hidden count.

## Commands

No build tooling exists yet. Once Vite is scaffolded the standard commands will apply (`npm run dev`, `npm run build`, `npm run lint`). Update this section after scaffolding.
