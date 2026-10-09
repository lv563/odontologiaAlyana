import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'

export function UserLayout() {
  const { logout, fullName } = useAuth()
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/app" className="brand">
          Odonto <span>Alyana</span>
        </Link>
        <div className="app-header-user">
          {fullName && <span className="muted">{fullName}</span>}
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
