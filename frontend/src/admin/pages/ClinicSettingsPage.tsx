import { useEffect, useState } from 'react'
import { api, ApiError } from '../../shared/api/client'
import type { ClinicSettingsDto } from '../../shared/api/types'

export function ClinicSettingsPage() {
  const [clinicPercent, setClinicPercent] = useState('50')
  const [retentionPercent, setRetentionPercent] = useState('15')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    api<ClinicSettingsDto>('/api/admin/settings')
      .then((s) => {
        setClinicPercent(String(s.clinicPercent))
        setRetentionPercent(String(s.retentionPercent))
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          clinicPercent: Number(clinicPercent),
          retentionPercent: Number(retentionPercent),
        }),
      })
      setMsg('Configuración guardada.')
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const clinicNum = Number(clinicPercent) || 0
  const retentionNum = Number(retentionPercent) || 0
  const doctorShare = 100 - clinicNum
  const netOfGross = doctorShare * (1 - retentionNum / 100)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="muted page-subtitle">Define cómo se reparte lo facturado entre la clínica y tú.</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <section className="panel">
          <h2>Reparto de ingresos</h2>
          <p className="muted">
            Por cada cita cobrada, primero se separa el porcentaje de la clínica; sobre lo que te queda a ti se
            aplica la retención. El resto es lo que recibes en neto.
          </p>

          <div className="settings-form">
            <label>
              % que se queda la clínica
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={clinicPercent}
                onChange={(e) => setClinicPercent(e.target.value)}
              />
            </label>
            <label>
              % de retención (sobre tu parte)
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(e.target.value)}
              />
            </label>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>

          {msg && <p className="muted">{msg}</p>}

          <div className="settings-preview">
            <strong>Ejemplo con RD$ 1,000.00 facturados:</strong>
            <ul>
              <li>Clínica ({clinicNum || 0}%): RD$ {(1000 * clinicNum / 100).toFixed(2)}</li>
              <li>Tu parte antes de retención: RD$ {(1000 * doctorShare / 100).toFixed(2)}</li>
              <li>Retención ({retentionNum || 0}% sobre tu parte): RD$ {(1000 * doctorShare / 100 * retentionNum / 100).toFixed(2)}</li>
              <li>
                <strong>Neto para ti: RD$ {(1000 * netOfGross / 100).toFixed(2)}</strong>
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
