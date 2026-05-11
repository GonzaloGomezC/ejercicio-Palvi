import { useState } from 'react'
import clsx from 'clsx'
import type { Direction } from '../types'
import { getTrendColor, type Trend } from '../lib/metrics'

type Props = {
  label: string
  values: (number | null)[]
  dates: string[]
  unit: string
  direction: Direction
  formatValue?: (v: number) => string
}

const W = 200
const H = 56
const PAD_Y = 6
const PAD_X = 2

const TREND_STROKE: Record<Trend, string> = {
  green: 'var(--color-status-green)',
  red: 'var(--color-status-red)',
  neutral: 'var(--color-navy-700)',
}

const TREND_TEXT: Record<Trend, string> = {
  green: 'text-status-green',
  red: 'text-status-red',
  neutral: 'text-navy-900',
}

const DEFAULT_FMT = (v: number) =>
  Number.isInteger(v) ? v.toLocaleString('es-CL') : v.toFixed(1)

export function Sparkline({
  label,
  values,
  dates,
  unit,
  direction,
  formatValue,
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const fmt = formatValue ?? DEFAULT_FMT

  const trend = getTrendColor(values, direction)
  const stroke = TREND_STROKE[trend]

  const lastValue = values[values.length - 1] ?? null
  const lastValueText =
    lastValue === null ? '—' : `${fmt(lastValue)} ${unit}`.trim()

  const numericValues = values.filter(
    (v): v is number => typeof v === 'number',
  )
  const hasData = numericValues.length > 0

  if (!hasData) {
    return (
      <div className="rounded-lg bg-white p-3 shadow-sm">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-navy-700/70 truncate">
            {label}
          </p>
          <p className="text-sm font-bold text-navy-700/40">—</p>
        </div>
        <div className="mt-2 h-14 grid place-items-center text-xs text-navy-700/40">
          sin datos
        </div>
      </div>
    )
  }

  const min = Math.min(...numericValues)
  const max = Math.max(...numericValues)
  const range = max - min || 1
  const stepX = (W - PAD_X * 2) / Math.max(values.length - 1, 1)

  const project = (i: number, v: number) => ({
    x: PAD_X + i * stepX,
    y: H - PAD_Y - ((v - min) / range) * (H - PAD_Y * 2),
  })

  const polylinePoints = values
    .map((v, i) => (typeof v === 'number' ? project(i, v) : null))
    .filter((p): p is { x: number; y: number } => p !== null)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const ratio = (x - PAD_X) / (W - PAD_X * 2)
    const idx = Math.round(ratio * (values.length - 1))
    setHoverIdx(Math.max(0, Math.min(values.length - 1, idx)))
  }

  const hoverValue = hoverIdx !== null ? values[hoverIdx] : null
  const hoverPoint =
    hoverIdx !== null && typeof hoverValue === 'number'
      ? { ...project(hoverIdx, hoverValue), v: hoverValue, date: dates[hoverIdx] }
      : null

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-navy-700/70 truncate">
          {label}
        </p>
        <p className={clsx('text-sm font-bold', TREND_TEXT[trend])}>
          {lastValueText}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full h-14"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={`Tendencia de ${label} en las últimas 4 semanas`}
      >
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hoverPoint && (
          <>
            <line
              x1={hoverPoint.x}
              y1={PAD_Y}
              x2={hoverPoint.x}
              y2={H - PAD_Y}
              stroke="var(--color-navy-700)"
              strokeWidth={0.5}
              opacity={0.3}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={2.5}
              fill={stroke}
            />
          </>
        )}
      </svg>

      <p className="mt-1 text-xs text-navy-700/60 h-4 truncate">
        {hoverPoint
          ? `${hoverPoint.date.slice(5)} · ${fmt(hoverPoint.v)} ${unit}`.trim()
          : ' '}
      </p>
    </div>
  )
}
