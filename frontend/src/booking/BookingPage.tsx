import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../shared/api/client'
import { useAuth } from '../shared/auth/AuthContext'
import { PublicHeader } from '../shared/components/PublicHeader'
import { TreatmentIcon } from '../shared/treatmentIcon'
import { IconCheck, IconPhone, IconShieldCheck } from '../shared/icons'
import { buildWhatsAppLink } from '../shared/clinicInfo'
import type { AvailableDayDto, TimeSlotDto, TreatmentDto } from '../shared/api/types'

const PENDING_KEY = 'odontoalyana.pendingBooking'
const STEP_LABELS = ['Tratamiento', 'Día', 'Hora', 'Confirmar']

interface PendingBooking {
  treatmentId: string
  date: string
  slot: TimeSlotDto
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
}
function formatDayNumber(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric' })
}
function formatMonth(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
}
function formatFullDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatTime(time: string) {
  return time.slice(0, 5)
}

export function BookingPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [treatments, setTreatments] = useState<TreatmentDto[]>([])
  const [treatmentId, setTreatmentId] = useState<string>('')
  const [days, setDays] = useState<AvailableDayDto[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null)
  const [notes, setNotes] = useState('')

  const [loadingDays, setLoadingDays] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Restaura una selección pendiente al volver de iniciar sesión / registrarse.
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return
    try {
      const pending: PendingBooking = JSON.parse(raw)
      setTreatmentId(pending.treatmentId)
      setSelectedDate(pending.date)
      setSelectedSlot(pending.slot)
    } catch {
      /* selección corrupta, se ignora */
    }
  }, [])

  useEffect(() => {
    api<TreatmentDto[]>('/api/treatments')
      .then(setTreatments)
      .catch(() => setTreatments([]))
  }, [])

  useEffect(() => {
    if (!treatmentId) {
      setDays([])
      return
    }
    setLoadingDays(true)
    setSelectedSlot(null)
    api<AvailableDayDto[]>(`/api/availability?treatmentId=${treatmentId}`)
      .then((data) => {
        setDays(data)
        setSelectedDate((current) => (data.some((d) => d.date === current) ? current : (data[0]?.date ?? '')))
      })
      .catch(() => setDays([]))
      .finally(() => setLoadingDays(false))
  }, [treatmentId])

  const selectedTreatment = useMemo(() => treatments.find((t) => t.id === treatmentId), [treatments, treatmentId])
  const slotsForDate = useMemo(() => days.find((d) => d.date === selectedDate)?.slots ?? [], [days, selectedDate])

  const currentStep = selectedSlot ? 4 : selectedDate ? 3 : treatmentId ? 2 : 1

  const whatsAppLink = useMemo(() => {
    if (!selectedTreatment || !selectedDate || !selectedSlot) return null
    const message = `Hola, agendé una cita para ${selectedTreatment.name} el ${formatFullDate(selectedDate)} a las ${formatTime(selectedSlot.startTime)}. Quisiera más información sobre el servicio.`
    return buildWhatsAppLink(message)
  }, [selectedTreatment, selectedDate, selectedSlot])

  // Al confirmar, la llevamos directo a WhatsApp para que consulte con la doctora.
  useEffect(() => {
    if (success && whatsAppLink) {
      window.open(whatsAppLink, '_blank', 'noopener,noreferrer')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success])

  async function confirmBooking() {
    if (!treatmentId || !selectedDate || !selectedSlot) return
    setError(null)

    if (!token) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ treatmentId, date: selectedDate, slot: selectedSlot }))
      navigate('/login?returnTo=/reservar')
      return
    }

    setSubmitting(true)
    try {
      await api('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          treatmentId,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          notes: notes || null,
        }),
      })
      sessionStorage.removeItem(PENDING_KEY)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo reservar la cita.')
      // el horario pudo haberse ocupado; refrescamos disponibilidad
      if (treatmentId) {
        const data = await api<AvailableDayDto[]>(`/api/availability?treatmentId=${treatmentId}`).catch(() => [])
        setDays(data)
        setSelectedSlot(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="page-public">
        <PublicHeader />
        <div className="section booking-success">
          <div className="success-badge">
            <IconShieldCheck />
          </div>
          <h1>¡Cita reservada!</h1>
          <p className="muted">Te enviamos la confirmación por correo. También te recordaremos antes de tu cita.</p>
          <p className="muted">Te abrimos un chat de WhatsApp con la doctora por si tienes alguna consulta sobre el servicio.</p>
          <div className="booking-success-actions">
            {whatsAppLink && (
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                <IconPhone /> Consultar por WhatsApp
              </a>
            )}
            <Link to="/app" className="btn btn-ghost btn-lg">
              Ver mis citas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-public">
      <PublicHeader />
      <div className="section booking-page">
        <h1>Reserva tu cita</h1>
        <p className="muted booking-intro">Elige tratamiento, día y hora. Toma menos de dos minutos.</p>

        <ol className="booking-progress">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1
            const state = stepNum < currentStep ? 'done' : stepNum === currentStep ? 'active' : 'pending'
            return (
              <li key={label} className={`progress-step progress-step-${state}`}>
                <span className="progress-dot">{state === 'done' ? <IconCheck /> : stepNum}</span>
                <span className="progress-label">{label}</span>
              </li>
            )
          })}
        </ol>

        <div className="booking-step">
          <h2>1. Elige el tratamiento</h2>
          <div className="treatment-options">
            {treatments.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`treatment-option ${treatmentId === t.id ? 'selected' : ''}`}
                onClick={() => setTreatmentId(t.id)}
              >
                <span className="treatment-option-icon">
                  <TreatmentIcon name={t.name} />
                </span>
                <span className="treatment-option-body">
                  <strong>{t.name}</strong>
                  <span className="pill">⏱ {t.durationMinutes} min</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {treatmentId && (
          <div className="booking-step">
            <h2>2. Elige el día</h2>
            {loadingDays && <p className="muted">Buscando horarios disponibles…</p>}
            {!loadingDays && days.length === 0 && (
              <p className="muted">No hay horarios disponibles en los próximos días, intenta más tarde.</p>
            )}
            <div className="day-picker">
              {days.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  className={`day-option ${selectedDate === d.date ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(d.date)
                    setSelectedSlot(null)
                  }}
                >
                  <span className="day-option-dow">{formatDay(d.date)}</span>
                  <span className="day-option-num">{formatDayNumber(d.date)}</span>
                  <span className="day-option-month">{formatMonth(d.date)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && (
          <div className="booking-step">
            <h2>3. Elige la hora</h2>
            {slotsForDate.length === 0 && <p className="muted">No quedan horarios libres ese día.</p>}
            <div className="slot-picker">
              {slotsForDate.map((s) => (
                <button
                  key={s.startTime}
                  type="button"
                  className={`slot-option ${selectedSlot?.startTime === s.startTime ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(s)}
                >
                  {formatTime(s.startTime)}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSlot && selectedTreatment && (
          <div className="booking-step booking-summary">
            <h2>4. Confirma tu cita</h2>
            <div className="summary-row">
              <span className="summary-icon">
                <TreatmentIcon name={selectedTreatment.name} />
              </span>
              <div>
                <strong>{selectedTreatment.name}</strong>
                <p className="muted summary-datetime">
                  {formatFullDate(selectedDate)} · {formatTime(selectedSlot.startTime)}
                </p>
              </div>
            </div>
            <label>
              Notas (opcional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Cuéntanos algo que debamos saber antes de tu cita" />
            </label>

            {!token && <p className="muted">Necesitas iniciar sesión o registrarte para confirmar tu cita.</p>}
            {error && <p className="form-error">{error}</p>}

            <button type="button" className="btn btn-primary btn-lg" onClick={confirmBooking} disabled={submitting}>
              {submitting ? 'Reservando…' : token ? 'Confirmar reserva' : 'Iniciar sesión y confirmar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
