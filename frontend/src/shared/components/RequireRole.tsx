import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../auth/AuthContext'

export function RequireRole({ role }: { role: Role }) {
  const auth = useAuth()
  if (!auth.token) return <Navigate to="/login" replace />
  if (auth.role !== role) return <Navigate to={auth.role === 'Admin' ? '/admin' : '/app'} replace />
  return <Outlet />
}