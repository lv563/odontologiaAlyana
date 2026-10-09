import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../shared/api/client'
import { formatCurrency } from '../../shared/format'
import { IconClipboardCheck, IconTrendingUp, IconUsers } from '../../shared/icons'
import type { StatsGranularity, StatsSummaryDto } from '../../shared/api/types'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1)
}
function endOfYear(d: Date) {
  return new Date(d.getFullYear(), 11, 31)
}
function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7
  const r = new Date(d)
  r.setDate(d.getDate() - day)
  return r
}
function endOfWeek(d: Date) {
  const r = startOfWeek(d)
  r.setDate(r.getDate() + 6)
  return r
}

const GRANULARITY_LABEL: Record<StatsGranularity, string> = { Day: 'Día', Week: 'Semana', Month: 'Mes', Year: 'Año' }
const GRANULARITIES: StatsGranularity[] = ['Day', 'Week', 'Month', 'Year']

export function MetricsPage() {
  const today = new Date()
  const [granularity, setGranularity] = useState<StatsGranularity>('Month')
  const [from, setFrom] = useState(isoDate(startOfYear(today)))
  const [to, setTo] = useState(isoDate(endOfYear(today)))
  const [data, setData] = useState<StatsSummaryDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function load(f = from, t = to, g = granularity) {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ from: f, to: t, granularity: g })
    api<StatsSummaryDto>(`/api/admin/stats?${params.toString()}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las métricas.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(preset: 'today' | 'week' | 'month' | 'year') {
    const now = new Date()
    // Se usa el periodo completo (no "hasta hoy"), para no esconder citas ya marcadas
    // como completadas con fecha dentro del periodo pero posterior al día de hoy.
    const presets: Record<typeof preset, [string, string, StatsGranularity]> = {
      today: [isoDate(now), isoDate(now), 'Day'],
      week: [isoDate(startOfWeek(now)), isoDate(endOfWeek(now)), 'Day'],
      month: [isoDate(startOfMonth(now)), isoDate(endOfMonth(now)), 'Day'],
      year: [isoDate(startOfYear(now)), isoDate(endOfYear(now)), 'Month'],
    }
    const [f, t, g] = presets[preset]
    setFrom(f)
    setTo(t)
    setGranularity(g)
    load(f, t, g)
  }

  const maxRevenue = Math.max(1, ...(data?.series.map((s) => s.revenue) ?? [0]))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted page-subtitle">Un vistazo a tus citas atendidas y lo que has ganado.</p>
        </div>
        <Link to="/admin/citas" className="btn btn-ghost btn-sm">
          Ver todas las citas →
        </Link>
      </div>

      <div className="filters">
        <div className="filter-presets">
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('today')}>
            Hoy
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('week')}>
            Esta semana
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('month')}>
            Este mes
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('year')}>
            Este año
          </button>
        </div>
        <div className="filter-divider" />
        <label>
          Desde
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          Agrupar por
          <select value={granularity} onChange={(e) => setGranularity(e.target.value as StatsGranularity)}>
            {GRANULARITIES.map((g) => (
              <option key={g} value={g}>
                {GRANULARITY_LABEL[g]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary btn-sm" onClick={() => load()}>
          Actualizar
        </button>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="form-error">{error}</p>}

      {data && !loading && (
        <>
          <div className="metrics-cards">
            <div className="metric-card">
              <span className="metric-card-icon">
                <IconClipboardCheck />
              </span>
              <span className="metric-label">Citas atendidas</span>
              <span className="metric-value">{data.totalCompleted}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card-icon">
                <IconUsers />
              </span>
              <span className="metric-label">Clientes atendidos</span>
              <span className="metric-value">{data.totalPatientsAttended}</span>
            </div>
            <div className="metric-card">
              <span className="metric-card-icon">
                <IconTrendingUp />
              </span>
              <span className="metric-label">Bruto total</span>
              <span className="metric-value">{formatCurrency(data.totalRevenue)}</span>
            </div>
            <div className="metric-card metric-card-accent">
              <span className="metric-card-icon metric-card-icon-accent">
                <IconTrendingUp />
              </span>
              <span className="metric-label">Neto (te queda)</span>
              <span className="metric-value">{formatCurrency(data.netRevenue)}</span>
            </div>
          </div>

          <section className="panel">
            <h2>Desglose del reparto</h2>
            <p className="muted">
              Clínica {data.clinicPercent}% · Retención {data.retentionPercent}% sobre tu parte.{' '}
              <Link to="/admin/configuracion">Cambiar →</Link>
            </p>
            <div className="breakdown-row">
              <span>
                Bruto facturado <strong>{formatCurrency(data.totalRevenue)}</strong>
              </span>
              <span className="breakdown-sep">−</span>
              <span>
                Comisión clínica ({data.clinicPercent}%) <strong>{formatCurrency(data.clinicCut)}</strong>
              </span>
              <span className="breakdown-sep">−</span>
              <span>
                Retención ({data.retentionPercent}%) <strong>{formatCurrency(data.retentionAmount)}</strong>
              </span>
              <span className="breakdown-sep">=</span>
              <span className="breakdown-net">
                Neto <strong>{formatCurrency(data.netRevenue)}</strong>
              </span>
            </div>
          </section>

          <section className="panel">
            <h2>Ingresos por periodo</h2>
            {data.series.every((s) => s.completedCount === 0) ? (
              <p className="muted">No hay citas completadas en este rango.</p>
            ) : (
              <div className="bar-chart-wrap">
                <div className="bar-chart">
                  {data.series.map((s) => (
                    <div
                      className="bar-chart-col"
                      key={s.periodStart}
                      title={`${s.period}: ${formatCurrency(s.revenue)} · ${s.completedCount} cita(s)`}
                    >
                      <div className="bar-chart-bar" style={{ height: `${Math.max(4, (s.revenue / maxRevenue) * 100)}%` }} />
                      <span className="bar-chart-label">{s.period}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Ganancias por tratamiento</h2>
            {data.byTreatment.length === 0 ? (
              <p className="muted">No hay datos para este rango.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tratamiento</th>
                      <th>Citas atendidas</th>
                      <th>Ingresos</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byTreatment.map((t) => {
                      const pct = data.totalRevenue > 0 ? (t.revenue / data.totalRevenue) * 100 : 0
                      return (
                        <tr key={t.treatmentId}>
                          <td>{t.treatmentName}</td>
                          <td>{t.completedCount}</td>
                          <td>{formatCurrency(t.revenue)}</td>
                          <td className="treatment-revenue-cell">
                            <div className="treatment-revenue-bar">
                              <div style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
