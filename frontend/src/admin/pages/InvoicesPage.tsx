import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../shared/api/client'
import { formatCurrency } from '../../shared/format'
import type { InvoiceWithPatientDto } from '../../shared/api/types'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithPatientDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api<InvoiceWithPatientDto[]>('/api/admin/invoices')
      .then(setInvoices)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las facturas.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter(
      (i) => i.patientName.toLowerCase().includes(q) || i.treatmentName.toLowerCase().includes(q),
    )
  }, [invoices, search])

  const total = filtered.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Facturas</h1>
          <p className="muted page-subtitle">Registro de todas las facturas emitidas a tus clientes.</p>
        </div>
      </div>

      <div className="filters">
        <label className="grow">
          Buscar
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cliente o tratamiento…" />
        </label>
        <span className="muted patients-count">
          {filtered.length} factura{filtered.length === 1 ? '' : 's'} · {formatCurrency(total)}
        </span>
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && invoices.length === 0 && <p className="muted">Todavía no se ha enviado ninguna factura.</p>}

      {filtered.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Tratamiento</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td className="nowrap">{formatDate(inv.issuedAtUtc)}</td>
                  <td>
                    <strong>{inv.patientName}</strong>
                    <div className="muted">{inv.patientEmail}</div>
                  </td>
                  <td>{inv.treatmentName}</td>
                  <td>{formatCurrency(inv.amount)}</td>
                  <td>
                    <span className={`pill ${inv.sentAtUtc ? 'pill-open' : ''}`}>
                      {inv.sentAtUtc ? 'Enviada' : 'Pendiente'}
                    </span>
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
