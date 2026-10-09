import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'
import type { AuthResponse } from '../../shared/api/types'

export function RegisterPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('returnTo')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phoneNumber, password }),
      })
      auth.login(res.token)
      navigate(returnTo ?? '/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <Link to="/" className="brand">
          Odonto <span>Alyana</span>
        </Link>
        <h1>Crear cuenta</h1>

        <label>
          Nombre completo
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label>
          Correo electrónico
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Teléfono de contacto (con código de país, ej. +18091234567)
          <input
            required
            placeholder="+1809..."
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>
        <label>
          Contraseña (mínimo 8 caracteres)
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="muted">
          ¿Ya tienes cuenta?{' '}
          <Link to={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>Inicia sesión</Link>
        </p>
      </form>
    </div>
  )
}
