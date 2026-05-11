import type { Dataset, Direction } from '../types'
import {
  computeAvg,
  computeDelta,
  computeWinRate,
  getLastDay,
} from '../lib/metrics'
import { KpiCard } from './KpiCard'

type Props = {
  dataset: Dataset
}

type SimpleKpi = {
  kind: 'simple'
  key: string
  label: string
  unit: string
  direction: Direction
}

type WinRateKpi = {
  kind: 'winrate'
  label: string
}

type KpiSpec = SimpleKpi | WinRateKpi

const KPIS: KpiSpec[] = [
  { kind: 'simple', key: 'leads_created', label: 'Leads', unit: 'leads', direction: 'higher_is_better' },
  { kind: 'simple', key: 'deals_won', label: 'Deals ganados', unit: 'deals', direction: 'higher_is_better' },
  { kind: 'winrate', label: 'Win rate' },
  { kind: 'simple', key: 'avg_response_time_min', label: 'T. respuesta', unit: 'min', direction: 'lower_is_better' },
  { kind: 'simple', key: 'stale_deals', label: 'Stale deals', unit: 'deals', direction: 'lower_is_better' },
  { kind: 'simple', key: 'support_tickets_opened', label: 'Tickets', unit: 'tickets', direction: 'lower_is_better' },
]

const PCT = (v: number) => `${(v * 100).toFixed(1)}%`

export function KpiStrip({ dataset }: Props) {
  const lastDay = getLastDay(dataset)
  const previousDays = dataset.days.slice(0, -1)

  return (
    <section
      aria-label="KPIs de ayer"
      className="grid grid-cols-2 xl:grid-cols-6 gap-4"
    >
      {KPIS.map((kpi, idx) => {
        if (kpi.kind === 'winrate') {
          const yesterdayWR = computeWinRate(dataset.days, 7)
          const baselineWR = computeWinRate(previousDays, 30)
          const delta = computeDelta(yesterdayWR, baselineWR, 'higher_is_better')
          return (
            <KpiCard
              key={idx}
              label={kpi.label}
              value={yesterdayWR}
              unit=""
              delta={delta}
              formatValue={PCT}
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
          />
        )
      })}
    </section>
  )
}
