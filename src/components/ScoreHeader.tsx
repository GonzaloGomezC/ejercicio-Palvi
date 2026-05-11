import clsx from 'clsx'
import type { AreaScore } from '../lib/scoring'
import { statusForScore } from '../lib/scoring'

type Props = {
  generalScore: number
  areaScores: AreaScore[]
}

const TONE_TEXT = {
  green: 'text-status-green',
  yellow: 'text-status-yellow',
  red: 'text-status-red',
} as const

export function ScoreHeader({ generalScore, areaScores }: Props) {
  const status = statusForScore(generalScore)
  const lowestScore = Math.min(...areaScores.map((a) => a.score))

  return (
    <section
      aria-label="Sales Health Score"
      className="rounded-lg bg-white p-6 shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
        Sales Health Score
      </p>

      <div className="mt-2 flex items-baseline gap-3">
        <p className={clsx('text-5xl font-bold', TONE_TEXT[status.tone])}>
          {Math.round(generalScore)}
        </p>
        <p className={clsx('text-base font-semibold', TONE_TEXT[status.tone])}>
          {status.emoji} {status.label}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {areaScores.map((area) => {
          const isLowest = area.score === lowestScore
          const tone = statusForScore(area.score).tone
          return (
            <div
              key={area.area}
              className={clsx(
                'rounded-md border p-2.5',
                isLowest
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-transparent bg-navy-900/5',
              )}
            >
              <p className="text-xs font-medium text-navy-700/70">
                {area.icon} {area.label}
              </p>
              <p
                className={clsx(
                  'mt-1 text-xl font-bold',
                  TONE_TEXT[tone],
                )}
              >
                {Math.round(area.score)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
