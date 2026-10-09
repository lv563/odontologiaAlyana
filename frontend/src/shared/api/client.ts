const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5118'

export const TOKEN_KEY = 'odontoalyana.token'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY)
  // Con FormData (subida de archivos) no fijamos Content-Type: el navegador pone el
  // boundary de multipart correcto solo si lo dejamos vacío.
  const isFormData = init.body instanceof FormData
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(message, res.status)
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
