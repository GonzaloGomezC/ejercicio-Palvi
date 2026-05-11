import type { Dataset, Direction } from '../types'
import {
  computeAvg,
  computeDelta,
  computeWinRate,
  getLastDay,
} from '../lib/metrics'
import { METRIC_DESCRIPTIONS } from '../lib/constants'
import { KpiCard } from './KpiCard'
import type { KpiDetailData } from './details/KpiDetail'

type Props = {
  dataset: Dataset
  onKpiClick?: (data: KpiDetailData) => void
}

type SimpleKpi = {
  kind: 'simple'
  key: string
  label: string
  unit: string
  direction: Direction
}

type WinRate7d = { kind: 'winrate-7d'; label: string }
type WinRateYesterday = { kind: 'winrate-yesterday'; label: string }

type KpiSpec = SimpleKpi | WinRate7d | WinRateYesterday

const KPIS: KpiSpec[] = [
  { kind: 'simple', key: 'leads_created', label: 'Leads', unit: 'leads', direction: 'higher_is_better' },
  { kind: 'simple', key: 'deals_won', label: 'Deals ganados', unit: 'deals', direction: 'higher_is_better' },
  { kind: 'winrate-7d', label: 'Win rate 7d' },
  { kind: 'winrate-yesterday', label: 'Win rate ayer' },
  { kind: 'simple', key: 'avg_response_time_min', label: 'T. respuesta', unit: 'min', direction: 'lower_is_better' },
  { kind: 'simple', key: 'stale_deals', label: 'Stale deals', unit: 'deals', direction: 'lower_is_better' },
  { kind: 'simple', key: 'support_tickets_opened', label: 'Tickets', unit: 'tickets', direction: 'lower_is_better' },
]

const PCT = (v: number) => `${(v * 100).toFixed(1)}%`

export function KpiStrip({ dataset, onKpiClick }: Props) {
  const lastDay = getLastDay(dataset)
  const previousDays = dataset.days.slice(0, -1)

  return (
    <section
      aria-label="KPIs de ayer"
      className="grid grid-cols-2 xl:grid-cols-7 gap-4"
    >
      {KPIS.map((kpi, idx) => {
        if (kpi.kind === 'winrate-7d') {
          const value = computeWinRate(dataset.days, 7)
          const baseline = computeWinRate(previousDays, 30)
          const delta = computeDelta(value, baseline, 'higher_is_better')
          return (
            <KpiCard
              key={idx}
              label={kpi.label}
              value={value}
              unit=""
              delta={delta}
              formatValue={PCT}
              onClick={
                onKpiClick
                  ? () =>
                      onKpiClick({
                        label: 'Win rate (últimos 7 días)',
                        description: METRIC_DESCRIPTIONS.win_rate,
                        unit: '',
                        direction: 'higher_is_better',
                        value,
                        baseline,
                        delta,
                        baselineLabel: 'Baseline 30d previos',
                        formatValue: PCT,
                        formula: {
                          label: 'won / (won + lost)',
                          parts: [
                            { label: 'Sumatoria won (7d)', value: sumKey(dataset.days.slice(-7), 'deals_won') },
                            { label: 'Sumatoria lost (7d)', value: sumKey(dataset.days.slice(-7), 'deals_lost') },
                          ],
                        },
                      })
                  : undefined
              }
            />
          )
        }

        if (kpi.kind === 'winrate-yesterday') {
          // Reusa computeWinRate con windowDays=1 — sin nuevas fórmulas
          const value = computeWinRate(dataset.days, 1)
          const baseline = computeWinRate(previousDays, 30)
          const delta = computeDelta(value, baseline, 'higher_is_better')
          return (
            <KpiCard
              key={idx}
              label={kpi.label}
              value={value}
              unit=""
              delta={delta}
              formatValue={PCT}
              onClick={
                onKpiClick
                  ? () =>
                      onKpiClick({
                        label: 'Win rate de ayer',
                        description:
                          'Tasa de cierre del último día disponible: deals ganados sobre el total de deals cerrados ese día (ganados + perdidos).',
                        unit: '',
                        direction: 'higher_is_better',
                        value,
                        baseline,
                        delta,
                        baselineLabel: 'Baseline 30d previos',
                        formatValue: PCT,
                        formula: {
                          label: 'won_ayer / (won_ayer + lost_ayer)',
                          parts: [
                            { label: 'Won ayer', value: lastDay?.metrics.deals_won ?? null },
                            { label: 'Lost ayer', value: lastDay?.metrics.deals_lost ?? null },
                          ],
                        },
                      })
                  : undefined
              }
            />
          )
        }

        const yesterdayValue = lastDay ? lastDay.metrics[kpi.key] ?? null : null
        const baseline = computeAvg(previousDays, kpi.key, 30)
        const delta = computeDelta(yesterdayValue, baseline, kpi.direction)

        return (
          <KpiCard
            key={idx}
            label={kpi.label}
            value={yesterdayValue}
            unit={kpi.unit}
            delta={delta}
            onClick={
              onKpiClick
                ? () =>
                    onKpiClick({
                      label: kpi.label,
                      description:
                        METRIC_DESCRIPTIONS[kpi.key] ?? 'Sin descripción.',
                      unit: kpi.unit,
                      direction: kpi.direction,
                      value: yesterdayValue,
                      baseline,
                      delta,
                      baselineLabel: 'Promedio últimos 30 días',
                    })
                : undefined
            }
          />
        )
      })}
    </section>
  )
}

function sumKey(days: { metrics: Record<string, number | null> }[], key: string): number {
  let sum = 0
  for (const d of days) {
    const v = d.metrics[key]
    if (typeof v === 'number') sum += v
  }
  return sum
}
