import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function PublicHeader() {
  const { token, role, fullName } = useAuth()

  return (
    <header className="public-header">
      <Link to="/" className="brand">
        Odonto <span>Alyana</span>
      </Link>
      <nav className="public-nav">
        <Link to="/#tratamientos">Tratamientos</Link>
        <Link to="/reservar" className="btn btn-primary btn-sm">
          Reservar cita
        </Link>
        {token ? (
          <Link to={role === 'Admin' ? '/admin' : '/app'} className="btn btn-ghost btn-sm">
            {fullName ? `Hola, ${fullName.split(' ')[0]}` : 'Mi cuenta'}
          </Link>
        ) : (
          <Link to="/login" className="btn btn-ghost btn-sm">
            Iniciar sesión
          </Link>
        )}
      </nav>
    </header>
  )
}
