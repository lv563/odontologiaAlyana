import { useEffect, useState } from 'react'
import { api, ApiError } from '../../shared/api/client'
import { formatCurrency } from '../../shared/format'
import type { AppointmentDto, AvailableDayDto, InvoiceDto, TreatmentDto } from '../../shared/api/types'

const STATUS_LABEL: Record<string, string> = {
  Confirmed: 'Confirmada',
  Cancelled: 'Cancelada',
  Completed: 'Completada',
  NoShow: 'No asistió',
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PatientDetail({ patientId, treatments }: { patientId: string; treatments: TreatmentDto[] }) {
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [invoices, setInvoices] = useState<InvoiceDto[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [treatmentId, setTreatmentId] = useState('')
  const [days, setDays] = useState<AvailableDayDto[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [invoiceApptId, setInvoiceApptId] = useState<string | null>(null)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    Promise.all([
      api<AppointmentDto[]>(`/api/admin/patients/${patientId}/appointments`),
      api<InvoiceDto[]>(`/api/admin/patients/${patientId}/invoices`),
    ])
      .then(([a, i]) => {
        setAppointments(a)
        setInvoices(i)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [patientId])

  useEffect(() => {
    if (!treatmentId) {
      setDays([])
      return
    }
    api<AvailableDayDto[]>(`/api/availability?treatmentId=${treatmentId}`).then((data) => {
      setDays(data)
      setDate(data[0]?.date ?? '')
      setStartTime('')
    })
  }, [treatmentId])

  const slotsForDate = days.find((d) => d.date === date)?.slots ?? []

  async function createAppointment() {
    if (!treatmentId || !date || !startTime) return
    setSaving(true)
    setFormError(null)
    try {
      await api(`/api/admin/patients/${patientId}/appointments`, {
        method: 'POST',
        body: JSON.stringify({ treatmentId, date, startTime, notes: null }),
      })
      setShowForm(false)
      setTreatmentId('')
      setDate('')
      setStartTime('')
      load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo agendar la cita.')
    } finally {
      setSaving(false)
    }
  }

  async function remind(id: string) {
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

  function openInvoiceUploader(appointmentId: string) {
    setInvoiceApptId((current) => (current === appointmentId ? null : appointmentId))
    setInvoiceFile(null)
    setInvoiceError(null)
  }

  async function sendInvoice(appointmentId: string) {
    setBusyId(appointmentId)
    setInvoiceError(null)
    try {
      const formData = new FormData()
      if (invoiceFile) formData.append('file', invoiceFile)
      await api(`/api/admin/patients/${patientId}/appointments/${appointmentId}/invoice`, {
        method: 'POST',
        body: formData,
      })
      setInvoiceApptId(null)
      setInvoiceFile(null)
      alert('Factura enviada por correo.')
      load()
    } catch (err) {
      setInvoiceError(err instanceof ApiError ? err.message : 'No se pudo enviar la factura.')
    } finally {
      setBusyId(null)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="patient-detail">
      <div className="patient-detail-header">
        <h2>Citas</h2>
        <button className="btn btn-outline btn-sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Agendar cita de seguimiento'}
        </button>
      </div>

      {showForm && (
        <div className="followup-form">
          <label>
            Tratamiento
            <select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
              <option value="">Elige…</option>
              {treatments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Día
            <select value={date} onChange={(e) => setDate(e.target.value)} disabled={days.length === 0}>
              {days.length === 0 && <option value="">Sin días disponibles</option>}
              {days.map((d) => (
                <option key={d.date} value={d.date}>
                  {formatDate(d.date)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hora
            <select value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={slotsForDate.length === 0}>
              <option value="">Elige…</option>
              {slotsForDate.map((s) => (
                <option key={s.startTime} value={s.startTime}>
                  {s.startTime.slice(0, 5)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary btn-sm" onClick={createAppointment} disabled={saving || !startTime}>
            {saving ? 'Agendando…' : 'Agendar'}
          </button>
          {formError && <p className="form-error">{formError}</p>}
        </div>
      )}

      {loading && <p className="muted">Cargando…</p>}
      {!loading && appointments.length === 0 && <p className="muted">Sin citas registradas.</p>}

      <div className="appointment-list">
        {appointments.map((a) => (
          <div className="appointment-card-wrap" key={a.id}>
            <div className="appointment-card">
              <div>
                <strong>{a.treatmentName}</strong>
                <p className="muted">
                  {formatDate(a.date)} · {a.startTime.slice(0, 5)}
                </p>
              </div>
              <div className="appointment-actions">
                <span className={`status status-${a.status.toLowerCase()}`}>{STATUS_LABEL[a.status]}</span>
                {a.status === 'Confirmed' && a.date >= today && (
                  <button className="btn btn-outline btn-sm" disabled={busyId === a.id} onClick={() => remind(a.id)}>
                    Recordar por correo
                  </button>
                )}
                {a.status === 'Completed' && (
                  <button className="btn btn-outline btn-sm" onClick={() => openInvoiceUploader(a.id)}>
                    {invoiceApptId === a.id ? 'Cancelar' : 'Enviar factura'}
                  </button>
                )}
              </div>
            </div>

            {invoiceApptId === a.id && (
              <div className="invoice-uploader">
                <label className="invoice-file-label">
                  Adjuntar factura (imagen o PDF) — opcional
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
                    onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {invoiceFile && <span className="muted invoice-file-name">{invoiceFile.name}</span>}
                <p className="muted invoice-uploader-hint">
                  Si no adjuntas nada, se genera y envía un PDF automático con el monto del tratamiento.
                </p>
                {invoiceError && <p className="form-error">{invoiceError}</p>}
                <button className="btn btn-primary btn-sm" disabled={busyId === a.id} onClick={() => sendInvoice(a.id)}>
                  {busyId === a.id ? 'Enviando…' : 'Enviar por correo'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {invoices.length > 0 && (
        <>
          <h2 className="subheading">Facturas enviadas</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Procedimiento</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{formatDate(inv.issuedAtUtc.slice(0, 10))}</td>
                    <td>{inv.treatmentName}</td>
                    <td>{formatCurrency(inv.amount)}</td>
                    <td>
                      <span className={`pill ${inv.sentAtUtc ? 'pill-open' : ''}`}>{inv.sentAtUtc ? 'Enviada' : 'Pendiente'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
