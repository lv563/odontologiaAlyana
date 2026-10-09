import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../shared/api/client'
import { PatientDetail } from '../components/PatientDetail'
import type { PatientDto, TreatmentDto } from '../../shared/api/types'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PatientsPage() {
  const [patients, setPatients] = useState<PatientDto[]>([])
  const [treatments, setTreatments] = useState<TreatmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api<PatientDto[]>('/api/admin/patients')
      .then(setPatients)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los clientes.'))
      .finally(() => setLoading(false))
    api<TreatmentDto[]>('/api/treatments').then(setTreatments)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phoneNumber ?? '').toLowerCase().includes(q),
    )
  }, [patients, search])

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
      </div>

      <div className="filters">
        <label className="grow">
          Buscar
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, correo o teléfono…"
          />
        </label>
        <span className="muted patients-count">
          {filtered.length} de {patients.length} cliente{patients.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && patients.length === 0 && <p className="muted">Todavía no hay clientes registrados.</p>}
      {!loading && patients.length > 0 && filtered.length === 0 && (
        <p className="muted">Ningún cliente coincide con "{search}".</p>
      )}

      <div className="patient-list">
        {filtered.map((p) => {
          const expanded = expandedId === p.id
          return (
            <div key={p.id} className={`patient-card ${expanded ? 'expanded' : ''}`}>
              <button
                type="button"
                className="patient-card-header"
                onClick={() => setExpandedId(expanded ? null : p.id)}
              >
                <span className="patient-avatar-row">
                  <span className="patient-avatar">{p.fullName.charAt(0).toUpperCase()}</span>
                  <span className="patient-main-info">
                    <strong>{p.fullName}</strong>
                    <span className="muted">
                      {p.email} · {p.phoneNumber ?? 'sin teléfono'}
                    </span>
                  </span>
                </span>
                <span className="patient-card-meta">
                  <span className="muted">Cliente desde {formatDate(p.createdAtUtc)}</span>
                  <span className="pill">{p.appointmentsCount} cita{p.appointmentsCount === 1 ? '' : 's'}</span>
                  {p.nextAppointmentDate ? (
                    <span className="pill pill-open">Próxima: {formatDate(p.nextAppointmentDate)}</span>
                  ) : (
                    <span className="pill">Sin citas próximas</span>
                  )}
                  <span className="patient-expand-caret">{expanded ? '▲' : '▼'}</span>
                </span>
              </button>

              {expanded && <PatientDetail patientId={p.id} treatments={treatments} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
