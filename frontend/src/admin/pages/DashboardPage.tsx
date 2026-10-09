import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../shared/api/client'
import type { AppointmentDto, AppointmentStatus } from '../../shared/api/types'

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  Confirmed: 'Confirmada',
  Cancelled: 'Cancelada',
  Completed: 'Completada',
  NoShow: 'No asistió',
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function DashboardPage() {
  const [from, setFrom] = useState(todayIso())
  const [to, setTo] = useState(addDaysIso(30))
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ from, to })
    if (status) params.set('status', status)
    api<AppointmentDto[]>(`/api/admin/appointments?${params.toString()}`)
      .then(setAppointments)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las citas.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, newStatus: AppointmentStatus) {
    setBusyId(id)
    try {
      await api(`/api/admin/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo actualizar la cita.')
    } finally {
      setBusyId(null)
    }
  }

  async function sendReminder(id: string) {
    setBusyId(id)
    try {
      await api(`/api/admin/appointments/${id}/send-reminder`, { method: 'POST' })
      alert('Recordatorio enviado por correo.')
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo enviar el recordatorio.')
    } finally {
      setBusyId(null)
    }
  }

  const counts = useMemo(() => {
    const base: Record<AppointmentStatus, number> = { Confirmed: 0, Completed: 0, Cancelled: 0, NoShow: 0 }
    for (const a of appointments) base[a.status]++
    return base
  }, [appointments])

  return (
    <div>
      <div className="page-header">
        <h1>Citas</h1>
        <Link to="/admin" className="btn btn-ghost btn-sm">
          ← Ir al dashboard
        </Link>
      </div>

      {appointments.length > 0 && (
        <div className="stat-chips">
          <span className="stat-chip">
            <strong>{appointments.length}</strong> en el rango
          </span>
          <span className="stat-chip stat-chip-confirmed">
            <strong>{counts.Confirmed}</strong> confirmadas
          </span>
          <span className="stat-chip stat-chip-completed">
            <strong>{counts.Completed}</strong> completadas
          </span>
          <span className="stat-chip stat-chip-cancelled">
            <strong>{counts.Cancelled + counts.NoShow}</strong> canceladas / no asistió
          </span>
        </div>
      )}

      <div className="filters">
        <label>
          Desde
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus | '')}>
            <option value="">Todos</option>
            <option value="Confirmed">Confirmada</option>
            <option value="Completed">Completada</option>
            <option value="Cancelled">Cancelada</option>
            <option value="NoShow">No asistió</option>
          </select>
        </label>
        <button className="btn btn-primary btn-sm" onClick={load}>
          Buscar
        </button>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && appointments.length === 0 && <p className="muted">No hay citas en ese rango.</p>}

      {appointments.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Contacto</th>
                <th>Tratamiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td className="nowrap">{formatDate(a.date)}</td>
                  <td className="nowrap">{a.startTime.slice(0, 5)}</td>
                  <td>
                    <div className="patient-avatar-row">
                      <span className="patient-avatar patient-avatar-sm">{a.patientName.charAt(0).toUpperCase()}</span>
                      <strong>{a.patientName}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="muted">{a.patientEmail}</div>
                    <div className="muted">{a.patientPhone ?? '—'}</div>
                  </td>
                  <td>{a.treatmentName}</td>
                  <td>
                    <span className={`status status-${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status]}</span>
                  </td>
                  <td className="actions-cell">
                    {a.status === 'Confirmed' ? (
                      <>
                        <button className="btn btn-outline btn-sm" disabled={busyId === a.id} onClick={() => sendReminder(a.id)}>
                          Recordatorio por correo
                        </button>
                        <button className="btn btn-outline btn-sm" disabled={busyId === a.id} onClick={() => updateStatus(a.id, 'Completed')}>
                          Completar
                        </button>
                        <button className="btn btn-outline btn-sm" disabled={busyId === a.id} onClick={() => updateStatus(a.id, 'NoShow')}>
                          No asistió
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={busyId === a.id} onClick={() => updateStatus(a.id, 'Cancelled')}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
