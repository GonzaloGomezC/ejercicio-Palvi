import { useEffect, useMemo, useState } from 'react'
import type { Dataset, DatasetKey } from '../types'
import {
  computeAlerts,
  computeAreaScores,
  computeGeneralScore,
  type Alert,
  type AreaScore,
} from '../lib/scoring'
import { DatasetTabs } from './DatasetTabs'
import { ScoreHeader } from './ScoreHeader'
import { AlertPanel } from './AlertPanel'
import { KpiStrip } from './KpiStrip'
import { SparklineGrid } from './SparklineGrid'
import { DetailPanel } from './DetailPanel'
import { AreaDetail } from './details/AreaDetail'
import { AlertDetail } from './details/AlertDetail'
import { KpiDetail, type KpiDetailData } from './details/KpiDetail'
import {
  SparklineDetail,
  type SparklineDetailData,
} from './details/SparklineDetail'

type Props = {
  dataset: Dataset
  active: DatasetKey
  onChange: (key: DatasetKey) => void
}

type Selection =
  | { kind: 'area'; area: AreaScore }
  | { kind: 'alert'; alert: Alert }
  | { kind: 'kpi'; data: KpiDetailData }
  | { kind: 'sparkline'; data: SparklineDetailData }

export function Dashboard({ dataset, active, onChange }: Props) {
  const areaScores = useMemo(() => computeAreaScores(dataset), [dataset])
  const generalScore = useMemo(
    () => computeGeneralScore(areaScores),
    [areaScores],
  )
  const alerts = useMemo(() => computeAlerts(areaScores), [areaScores])

  const [selection, setSelection] = useState<Selection | null>(null)

  // Cerrar panel al cambiar de dataset (los datos referenciados ya no aplican)
  useEffect(() => {
    setSelection(null)
  }, [dataset])

  const closePanel = () => setSelection(null)

  let panelTitle = ''
  let panelBody: React.ReactNode = null
  if (selection?.kind === 'area') {
    panelTitle = `Área · ${selection.area.label}`
    panelBody = <AreaDetail area={selection.area} />
  } else if (selection?.kind === 'alert') {
    panelTitle = `Alerta · ${selection.alert.metricLabel}`
    panelBody = <AlertDetail alert={selection.alert} />
  } else if (selection?.kind === 'kpi') {
    panelTitle = `KPI · ${selection.data.label}`
    panelBody = <KpiDetail data={selection.data} />
  } else if (selection?.kind === 'sparkline') {
    panelTitle = `Tendencia · ${selection.data.label}`
    panelBody = <SparklineDetail data={selection.data} />
  }

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
        <ScoreHeader
          generalScore={generalScore}
          areaScores={areaScores}
          onAreaClick={(area) => setSelection({ kind: 'area', area })}
        />
        <AlertPanel
          alerts={alerts}
          onAlertClick={(alert) => setSelection({ kind: 'alert', alert })}
        />

        <div>
          <h2 className="text-sm font-semibold text-navy-700/80 mb-3">
            Resumen de ayer
          </h2>
          <KpiStrip
            dataset={dataset}
            onKpiClick={(data) => setSelection({ kind: 'kpi', data })}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-navy-700/80 mb-3">
            Tendencias últimas 4 semanas
          </h2>
          <SparklineGrid
            dataset={dataset}
            onSparkClick={(data) => setSelection({ kind: 'sparkline', data })}
          />
        </div>
      </main>

      <DetailPanel
        open={selection !== null}
        onClose={closePanel}
        title={panelTitle}
      >
        {panelBody}
      </DetailPanel>
    </div>
  )
}
