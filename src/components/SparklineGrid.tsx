import type { Dataset, Direction } from '../types'
import { interpolateNulls, rollingWinRate } from '../lib/metrics'
import { Sparkline } from './Sparkline'
import type { SparklineDetailData } from './details/SparklineDetail'

type Props = {
  dataset: Dataset
  windowDays?: number
  onSparkClick?: (data: SparklineDetailData) => void
}

type SparkSpec =
  | { kind: 'simple'; key: string; label: string; unit: string; direction: Direction }
  | { kind: 'winrate'; label: string }

const SPARKS: SparkSpec[] = [
  { kind: 'simple', key: 'leads_created', label: 'Leads', unit: 'leads', direction: 'higher_is_better' },
  { kind: 'simple', key: 'deals_won', label: 'Deals ganados', unit: 'deals', direction: 'higher_is_better' },
  { kind: 'winrate', label: 'Win rate' },
  { kind: 'simple', key: 'avg_response_time_min', label: 'T. respuesta', unit: 'min', direction: 'lower_is_better' },
  { kind: 'simple', key: 'stale_deals', label: 'Stale deals', unit: 'deals', direction: 'lower_is_better' },
  { kind: 'simple', key: 'support_tickets_opened', label: 'Tickets', unit: 'tickets', direction: 'lower_is_better' },
  { kind: 'simple', key: 'avg_deal_cycle_days', label: 'Ciclo deal', unit: 'días', direction: 'lower_is_better' },
]

const PCT = (v: number) => `${(v * 100).toFixed(1)}%`

export function SparklineGrid({
  dataset,
  windowDays = 28,
  onSparkClick,
}: Props) {
  const window = dataset.days.slice(-windowDays)
  const dates = window.map((d) => d.date)

  return (
    <section
      aria-label="Tendencias últimas 4 semanas"
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
    >
      {SPARKS.map((spec, idx) => {
        if (spec.kind === 'winrate') {
          const fullSeries = rollingWinRate(dataset.days, 7)
          const raw = fullSeries.slice(-windowDays)
          const values = interpolateNulls(raw)
          return (
            <Sparkline
              key={idx}
              label={spec.label}
              values={values}
              dates={dates}
              unit=""
              direction="higher_is_better"
              formatValue={PCT}
              onClick={
                onSparkClick
                  ? () =>
                      onSparkClick({
                        label: spec.label,
                        values,
                        dates,
                        unit: '',
                        direction: 'higher_is_better',
                        formatValue: PCT,
                      })
                  : undefined
              }
            />
          )
        }

        const raw = window.map((d) => {
          const v = d.metrics[spec.key]
          return typeof v === 'number' ? v : null
        })
        const values = interpolateNulls(raw)

        return (
          <Sparkline
            key={idx}
            label={spec.label}
            values={values}
            dates={dates}
            unit={spec.unit}
            direction={spec.direction}
            onClick={
              onSparkClick
                ? () =>
                    onSparkClick({
                      label: spec.label,
                      values,
                      dates,
                      unit: spec.unit,
                      direction: spec.direction,
                    })
                : undefined
            }
          />
        )
      })}
    </section>
  )
}
