import { useMemo } from 'react'
import type { Dataset, DatasetKey } from '../types'
import {
  computeAlerts,
  computeAreaScores,
  computeGeneralScore,
} from '../lib/scoring'
import { DatasetTabs } from './DatasetTabs'
import { ScoreHeader } from './ScoreHeader'
import { AlertPanel } from './AlertPanel'
import { KpiStrip } from './KpiStrip'

type Props = {
  dataset: Dataset
  active: DatasetKey
  onChange: (key: DatasetKey) => void
}

export function Dashboard({ dataset, active, onChange }: Props) {
  const areaScores = useMemo(() => computeAreaScores(dataset), [dataset])
  const generalScore = useMemo(
    () => computeGeneralScore(areaScores),
    [areaScores],
  )
  const alerts = useMemo(() => computeAlerts(areaScores), [areaScores])

  return (
    <div className="min-h-full">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Palvi · Dashboard Ejecutivo</h1>
            <p className="text-xs text-white/60">
              Dataset {active} · {dataset.days.length} días
            </p>
          </div>
          <DatasetTabs active={active} onChange={onChange} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        <ScoreHeader generalScore={generalScore} areaScores={areaScores} />
        <AlertPanel alerts={alerts} />

        <div>
          <h2 className="text-sm font-semibold text-navy-700/80 mb-3">
            Resumen de ayer
          </h2>
          <KpiStrip dataset={dataset} />
        </div>
      </main>
    </div>
  )
}
