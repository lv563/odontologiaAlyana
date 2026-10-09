import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../shared/api/client'
import type { AppointmentDto } from '../../shared/api/types'

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<string, string> = {
  Confirmed: 'Confirmada',
  Cancelled: 'Cancelada',
  Completed: 'Completada',
  NoShow: 'No asistió',
}

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api<AppointmentDto[]>('/api/appointments/mine')
      .then(setAppointments)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar tus citas.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function cancel(id: string) {
    if (!confirm('¿Seguro que quieres cancelar esta cita?')) return
    setCancellingId(id)
    try {
      await api(`/api/appointments/${id}/cancel`, { method: 'POST' })
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo cancelar la cita.')
    } finally {
      setCancellingId(null)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter((a) => a.status === 'Confirmed' && a.date >= today)
  const history = appointments.filter((a) => !(a.status === 'Confirmed' && a.date >= today))

  return (
    <div>
      <div className="page-header">
        <h1>Mis citas</h1>
        <Link to="/reservar" className="btn btn-primary">
          + Nueva cita
        </Link>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && upcoming.length === 0 && appointments.length === 0 && (
        <p className="muted">Todavía no tienes citas. ¡Reserva la primera!</p>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="subheading">Próximas</h2>
          <div className="appointment-list">
            {upcoming.map((a) => (
              <div className="appointment-card" key={a.id}>
                <div>
                  <strong>{a.treatmentName}</strong>
                  <p className="muted">
                    {formatDate(a.date)} · {a.startTime.slice(0, 5)}
                  </p>
                </div>
                <div className="appointment-actions">
                  <span className={`status status-${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status]}</span>
                  <button className="btn btn-outline btn-sm" onClick={() => cancel(a.id)} disabled={cancellingId === a.id}>
                    {cancellingId === a.id ? 'Cancelando…' : 'Cancelar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <h2 className="subheading">Historial</h2>
          <div className="appointment-list">
            {history.map((a) => (
              <div className="appointment-card" key={a.id}>
                <div>
                  <strong>{a.treatmentName}</strong>
                  <p className="muted">
                    {formatDate(a.date)} · {a.startTime.slice(0, 5)}
                  </p>
                </div>
                <span className={`status status-${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
