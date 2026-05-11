import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import type { DatasetKey, MetricsFile } from './types'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: MetricsFile }

export function App() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [active, setActive] = useState<DatasetKey>('A')

  useEffect(() => {
    let cancelled = false
    fetch('/metrics.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<MetricsFile>
      })
      .then((data) => {
        if (cancelled) return
        if (!data?.A || !data?.B || !data?.C || !data?.D) {
          throw new Error('Estructura de metrics.json inválida')
        }
        setLoad({ status: 'ready', data })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setLoad({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (load.status === 'loading') {
    return (
      <main className="min-h-full grid place-items-center">
        <p className="text-navy-700">Cargando datos…</p>
      </main>
    )
  }

  if (load.status === 'error') {
    return (
      <main className="min-h-full grid place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-status-red">
            No se pudieron cargar los datos
          </h1>
          <p className="mt-2 text-sm text-navy-700">{load.message}</p>
        </div>
      </main>
    )
  }

  return (
    <Dashboard
      dataset={load.data[active]}
      active={active}
      onChange={setActive}
    />
  )
}
