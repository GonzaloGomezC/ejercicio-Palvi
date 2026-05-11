import type { Dataset, DayEntry, Direction } from '../types'
import { computeAvg, computeWinRate } from './metrics'
import {
  AREAS,
  AREA_KEYS,
  IMPACT_MESSAGES,
  METRIC_DIRECTIONS,
  METRIC_LABELS,
  type AreaKey,
} from './constants'

export type MetricScore = {
  key: string
  score: number              // 0-100, 50 = neutral
  delta: number | null       // direction-adjusted % (positive = improvement); null if not evaluable
  rawDelta: number | null    // raw % change (sign reflects direction of value change)
  avg7d: number | null
  avg30d: number | null
}

export type AreaScore = {
  area: AreaKey
  label: string
  icon: string
  score: number
  metrics: MetricScore[]
}

export type Alert = {
  metricKey: string
  metricLabel: string
  delta: number | null
  rawDelta: number | null
  avg7d: number | null
  avg30d: number | null
  severity: 'critical' | 'warning'
  impactMessage: string
  areaLabel: string
  areaScore: number
  trigger: 'delta' | 'score' | 'both'
}

export type StatusTone = 'green' | 'yellow' | 'red'

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

function scoreFromAvgs(
  avg7d: number | null,
  avg30d: number | null,
  direction: Direction,
): { score: number; delta: number | null; rawDelta: number | null } {
  if (avg7d === null || avg30d === null) {
    return { score: 50, delta: null, rawDelta: null }
  }
  if (avg30d === 0) {
    return { score: 50, delta: null, rawDelta: null }
  }
  const rawDelta = ((avg7d - avg30d) / avg30d) * 100
  const delta = direction === 'higher_is_better' ? rawDelta : -rawDelta
  const score = clamp(50 + delta * 0.5, 0, 100)
  return { score, delta, rawDelta }
}

function metricScoreFor(days: DayEntry[], key: string): MetricScore {
  const direction = METRIC_DIRECTIONS[key] ?? 'higher_is_better'
  const baselineDays = days.slice(0, -7)

  let avg7d: number | null
  let avg30d: number | null

  if (key === 'win_rate') {
    avg7d = computeWinRate(days, 7)
    avg30d = computeWinRate(baselineDays, 30)
  } else {
    avg7d = computeAvg(days, key, 7)
    avg30d = computeAvg(baselineDays, key, 30)
  }

  const { score, delta, rawDelta } = scoreFromAvgs(avg7d, avg30d, direction)
  return { key, score, delta, rawDelta, avg7d, avg30d }
}

export function computeAreaScores(dataset: Dataset): AreaScore[] {
  return AREA_KEYS.map((area) => {
    const cfg = AREAS[area]
    const metrics = cfg.metrics.map((k) => metricScoreFor(dataset.days, k))
    const avg = metrics.reduce((s, m) => s + m.score, 0) / metrics.length
    return {
      area,
      label: cfg.label,
      icon: cfg.icon,
      score: avg,
      metrics,
    }
  })
}

export function computeGeneralScore(areaScores: AreaScore[]): number {
  let sum = 0
  for (const a of areaScores) {
    sum += a.score * AREAS[a.area].weight
  }
  return sum
}

export function computeAlerts(areaScores: AreaScore[]): Alert[] {
  const alerts: Alert[] = []
  for (const area of areaScores) {
    for (const metric of area.metrics) {
      const deltaTrigger = metric.delta !== null && metric.delta < -20
      const scoreTrigger = area.score < 50
      if (!deltaTrigger && !scoreTrigger) continue

      const trigger: Alert['trigger'] =
        deltaTrigger && scoreTrigger ? 'both' : deltaTrigger ? 'delta' : 'score'

      const isCritical =
        (metric.delta !== null && metric.delta < -40) || area.score < 35

      alerts.push({
        metricKey: metric.key,
        metricLabel: METRIC_LABELS[metric.key] ?? metric.key,
        delta: metric.delta,
        rawDelta: metric.rawDelta,
        avg7d: metric.avg7d,
        avg30d: metric.avg30d,
        severity: isCritical ? 'critical' : 'warning',
        impactMessage: IMPACT_MESSAGES[metric.key] ?? '',
        areaLabel: area.label,
        areaScore: area.score,
        trigger,
      })
    }
  }
  // Sort by |delta| desc; null deltas (score-only triggers) sort last via 0
  alerts.sort(
    (a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0),
  )
  return alerts
}

export function statusForScore(score: number): {
  tone: StatusTone
  emoji: string
  label: string
} {
  if (score >= 75)
    return { tone: 'green', emoji: '🟢', label: 'Operación saludable' }
  if (score >= 50)
    return { tone: 'yellow', emoji: '🟡', label: 'Atención requerida' }
  return { tone: 'red', emoji: '🔴', label: 'Acción urgente' }
}
