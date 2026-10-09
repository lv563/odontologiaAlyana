import { useEffect, useState } from 'react'
import { api, ApiError } from '../../shared/api/client'
import { formatCurrency } from '../../shared/format'
import type { TreatmentDto } from '../../shared/api/types'

interface FormState {
  id: string | null
  name: string
  description: string
  durationMinutes: number
  price: string
  isActive: boolean
}

const EMPTY_FORM: FormState = { id: null, name: '', description: '', durationMinutes: 30, price: '', isActive: true }

export function TreatmentsPage() {
  const [treatments, setTreatments] = useState<TreatmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api<TreatmentDto[]>('/api/admin/treatments')
      .then(setTreatments)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function edit(t: TreatmentDto) {
    setForm({
      id: t.id,
      name: t.name,
      description: t.description ?? '',
      durationMinutes: t.durationMinutes,
      price: t.price?.toString() ?? '',
      isActive: t.isActive,
    })
  }

  async function submit() {
    setSaving(true)
    setError(null)
    const body = JSON.stringify({
      name: form.name,
      description: form.description || null,
      durationMinutes: form.durationMinutes,
      price: form.price ? Number(form.price) : null,
      isActive: form.isActive,
    })
    try {
      if (form.id) {
        await api(`/api/admin/treatments/${form.id}`, { method: 'PUT', body })
      } else {
        await api('/api/admin/treatments', { method: 'POST', body })
      }
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el tratamiento.')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(id: string) {
    if (!confirm('¿Desactivar este tratamiento? Dejará de verse en la reserva pública.')) return
    await api(`/api/admin/treatments/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tratamientos</h1>
      </div>

      <section className="panel">
        <h2>{form.id ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h2>
        <div className="treatment-form">
          <label className="grow">
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="grow">
            Descripción
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label>
            Duración (min)
            <input
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </label>
          <label>
            Precio (opcional)
            <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Activo
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={saving || !form.name}>
            {saving ? 'Guardando…' : form.id ? 'Actualizar' : 'Crear tratamiento'}
          </button>
          {form.id && (
            <button className="btn btn-ghost btn-sm" onClick={() => setForm(EMPTY_FORM)}>
              Cancelar edición
            </button>
          )}
        </div>
      </section>

      {loading && <p className="muted">Cargando…</p>}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {treatments.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.name}</strong>
                    {t.description && <div className="muted">{t.description}</div>}
                  </td>
                  <td>{t.durationMinutes} min</td>
                  <td>{t.price != null ? formatCurrency(t.price) : '—'}</td>
                  <td>
                    <span className={`status status-${t.isActive ? 'confirmed' : 'cancelled'}`}>
                      {t.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn btn-outline btn-sm" onClick={() => edit(t)}>
                      Editar
                    </button>
                    {t.isActive && (
                      <button className="btn btn-danger btn-sm" onClick={() => deactivate(t.id)}>
                        Desactivar
                      </button>
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
