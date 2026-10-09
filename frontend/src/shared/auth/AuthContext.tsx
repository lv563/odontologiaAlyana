import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_KEY } from '../api/client'

export type Role = 'Admin' | 'User'

interface AuthState {
  token: string | null
  role: Role | null
  fullName: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

function readClaims(token: string | null): { role: Role | null; fullName: string | null } {
  if (!token) return { role: null, fullName: null }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const role = payload[ROLE_CLAIM] ?? payload.role
    const fullName = payload[NAME_CLAIM] ?? payload.name ?? null
    return { role: role === 'Admin' || role === 'User' ? role : null, fullName }
  } catch {
    return { role: null, fullName: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // sessionStorage (no localStorage): cada pestaña mantiene su propia sesión, así se puede
  // estar como admin en una pestaña y como paciente en otra sin que una pise la sesión de la otra.
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY))

  const value = useMemo<AuthState>(() => {
    const claims = readClaims(token)
    return {
      token,
      role: claims.role,
      fullName: claims.fullName,
      login: (t) => {
        sessionStorage.setItem(TOKEN_KEY, t)
        setToken(t)
      },
      logout: () => {
        sessionStorage.removeItem(TOKEN_KEY)
        setToken(null)
      },
    }
  }, [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
