import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'

export function AdminLayout() {
  const { logout, fullName } = useAuth()
  return (
    <div className="app-shell">
      <header className="app-header">
        <strong>Odonto Alyana · Admin</strong>
        <nav>
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/citas">Citas</NavLink>
          <NavLink to="/admin/clientes">Clientes</NavLink>
          <NavLink to="/admin/horarios">Horarios</NavLink>
          <NavLink to="/admin/tratamientos">Tratamientos</NavLink>
          <NavLink to="/admin/facturas">Facturas</NavLink>
          <NavLink to="/admin/configuracion">Configuración</NavLink>
        </nav>
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
