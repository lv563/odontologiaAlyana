import { useEffect, useState } from 'react'
import { api, ApiError } from '../../shared/api/client'
import { IconCheck, IconClipboardCheck } from '../../shared/icons'
import type { DayOverrideDto, WorkingHoursDto } from '../../shared/api/types'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // lunes..domingo (0 = domingo en .NET)
const WEEKDAYS = [1, 2, 3, 4, 5] // lunes a viernes, para el atajo "copiar a días laborales"
const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
}
function defaultRow(dayOfWeek: number): WorkingHoursDto {
  return { dayOfWeek, startTime: '08:00:00', endTime: '17:00:00', isActive: false }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
function addDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function SchedulePage() {
  const [hours, setHours] = useState<WorkingHoursDto[]>(DAY_ORDER.map(defaultRow))
  const [savedHours, setSavedHours] = useState<WorkingHoursDto[]>(DAY_ORDER.map(defaultRow))
  const [savingHours, setSavingHours] = useState(false)
  const [hoursMsg, setHoursMsg] = useState<string | null>(null)

  const [overrides, setOverrides] = useState<DayOverrideDto[]>([])
  const [newDate, setNewDate] = useState(todayIso())
  const [newIsOpen, setNewIsOpen] = useState(false)
  const [newStart, setNewStart] = useState('08:00')
  const [newEnd, setNewEnd] = useState('12:00')
  const [newNote, setNewNote] = useState('')
  const [savingOverride, setSavingOverride] = useState(false)

  const isDirty = JSON.stringify(hours) !== JSON.stringify(savedHours)

  function loadHours() {
    api<WorkingHoursDto[]>('/api/admin/schedule/working-hours').then((data) => {
      if (data.length === 0) return
      const normalized = DAY_ORDER.map((d) => data.find((x) => x.dayOfWeek === d) ?? defaultRow(d))
      setHours(normalized)
      setSavedHours(normalized)
    })
  }

  function loadOverrides() {
    const params = new URLSearchParams({ from: todayIso(), to: addDaysIso(90) })
    api<DayOverrideDto[]>(`/api/admin/schedule/overrides?${params.toString()}`).then(setOverrides)
  }

  useEffect(() => {
    loadHours()
    loadOverrides()
  }, [])

  function updateRow(dayOfWeek: number, patch: Partial<WorkingHoursDto>) {
    setHoursMsg(null)
    setHours((rows) => rows.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)))
  }

  function copyMondayToWeekdays() {
    const monday = hours.find((r) => r.dayOfWeek === 1)
    if (!monday) return
    setHoursMsg(null)
    setHours((rows) =>
      rows.map((r) =>
        WEEKDAYS.includes(r.dayOfWeek)
          ? { ...r, startTime: monday.startTime, endTime: monday.endTime, isActive: true }
          : r,
      ),
    )
  }

  function discardChanges() {
    setHours(savedHours)
    setHoursMsg(null)
  }

  async function saveHours() {
    setSavingHours(true)
    setHoursMsg(null)
    try {
      await api('/api/admin/schedule/working-hours', {
        method: 'PUT',
        body: JSON.stringify({ days: hours }),
      })
      setSavedHours(hours)
      setHoursMsg('Horario guardado.')
    } catch (err) {
      setHoursMsg(err instanceof ApiError ? err.message : 'No se pudo guardar el horario.')
    } finally {
      setSavingHours(false)
    }
  }

  async function addOverride() {
    setSavingOverride(true)
    try {
      await api('/api/admin/schedule/overrides', {
        method: 'POST',
        body: JSON.stringify({
          date: newDate,
          isOpen: newIsOpen,
          startTime: newIsOpen ? `${newStart}:00` : null,
          endTime: newIsOpen ? `${newEnd}:00` : null,
          note: newNote || null,
        }),
      })
      setNewNote('')
      loadOverrides()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo guardar la excepción.')
    } finally {
      setSavingOverride(false)
    }
  }

  async function deleteOverride(id: string) {
    if (!confirm('¿Eliminar esta excepción? El día volverá al horario semanal normal.')) return
    await api(`/api/admin/schedule/overrides/${id}`, { method: 'DELETE' })
    loadOverrides()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Horarios</h1>
      </div>

      <section className="panel">
        <div className="panel-heading-row">
          <div>
            <h2>Horario semanal</h2>
            <p className="muted">Activa los días que atiende la clínica y define su horario.</p>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={copyMondayToWeekdays}>
            <IconClipboardCheck /> Copiar horario del lunes a Lun-Vie
          </button>
        </div>

        <div className="schedule-days">
          {DAY_ORDER.map((d) => {
            const row = hours.find((r) => r.dayOfWeek === d)!
            return (
              <div key={d} className={`schedule-day-row ${row.isActive ? 'is-open' : 'is-closed'}`}>
                <div className="schedule-day-name">
                  <span className="schedule-day-dot" aria-hidden="true" />
                  {DAY_NAMES[d]}
                </div>

                <label className="toggle-switch" aria-label={`${DAY_NAMES[d]} ${row.isActive ? 'abierto' : 'cerrado'}`}>
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(e) => updateRow(d, { isActive: e.target.checked })}
                  />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </label>

                <div className="schedule-time-fields">
                  <input
                    type="time"
                    value={row.startTime.slice(0, 5)}
                    disabled={!row.isActive}
                    onChange={(e) => updateRow(d, { startTime: `${e.target.value}:00` })}
                  />
                  <span className="schedule-time-sep">→</span>
                  <input
                    type="time"
                    value={row.endTime.slice(0, 5)}
                    disabled={!row.isActive}
                    onChange={(e) => updateRow(d, { endTime: `${e.target.value}:00` })}
                  />
                </div>

                <span className={`pill schedule-status-pill ${row.isActive ? 'pill-open' : ''}`}>
                  {row.isActive ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
            )
          })}
        </div>

        <div className="schedule-save-bar">
          {hoursMsg && (
            <p className="muted schedule-save-msg">
              {hoursMsg === 'Horario guardado.' && <IconCheck />} {hoursMsg}
            </p>
          )}
          {isDirty && !hoursMsg && <p className="muted schedule-save-msg">● Tienes cambios sin guardar</p>}
          <div className="form-actions">
            {isDirty && (
              <button className="btn btn-ghost btn-sm" onClick={discardChanges} disabled={savingHours}>
                Descartar cambios
              </button>
            )}
            <button className="btn btn-primary" onClick={saveHours} disabled={savingHours || !isDirty}>
              {savingHours ? 'Guardando…' : 'Guardar horario semanal'}
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Excepciones por fecha</h2>
        <p className="muted">Cierra un día habitual (feriado) o abre uno extra con horario propio.</p>

        <div className="override-form">
          <label>
            Fecha
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </label>
          <label>
            Estado
            <select value={newIsOpen ? 'open' : 'closed'} onChange={(e) => setNewIsOpen(e.target.value === 'open')}>
              <option value="closed">Cerrado</option>
              <option value="open">Abierto</option>
            </select>
          </label>
          {newIsOpen && (
            <>
              <label>
                Desde
                <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </label>
              <label>
                Hasta
                <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </label>
            </>
          )}
          <label className="grow">
            Nota
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ej. Feriado nacional" />
          </label>
          <button className="btn btn-primary btn-sm" onClick={addOverride} disabled={savingOverride}>
            Guardar
          </button>
        </div>

        {overrides.length === 0 && <p className="muted">No hay excepciones próximas.</p>}
        {overrides.length > 0 && (
          <div className="override-list">
            {overrides.map((o) => (
              <div key={o.id} className={`override-chip ${o.isOpen ? 'is-open' : 'is-closed'}`}>
                <div>
                  <strong>{new Date(`${o.date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                  <span className={`pill schedule-status-pill ${o.isOpen ? 'pill-open' : ''}`}>
                    {o.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                  {o.isOpen && o.startTime && o.endTime && (
                    <span className="muted"> · {o.startTime.slice(0, 5)} - {o.endTime.slice(0, 5)}</span>
                  )}
                  {o.note && <p className="muted override-chip-note">{o.note}</p>}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteOverride(o.id)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
