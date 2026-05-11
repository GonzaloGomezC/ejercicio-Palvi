export type DatasetKey = 'A' | 'B' | 'C' | 'D'

export type Direction = 'higher_is_better' | 'lower_is_better'

export type MetricMeta = {
  key: string
  label: string
  unit: string
  direction: Direction
  description: string
}

export type DayEntry = {
  date: string
  metrics: Record<string, number | null>
}

export type Dataset = {
  metadata: {
    start_date?: string
    end_date?: string
    days?: number
    metrics: MetricMeta[]
  }
  days: DayEntry[]
}

export type MetricsFile = Record<DatasetKey, Dataset>
