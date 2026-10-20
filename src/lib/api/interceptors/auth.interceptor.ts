import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

/** Rotas de auth que nunca devem disparar renovação de sessão (evita loop). */
const SKIP_REFRESH_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
]

interface RetriableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface AuthInterceptorOptions {
  /** Chamado quando a renovação falha: limpar estado de sessão e ir para o login. */
  onSessionExpired: () => void
}

// Promise compartilhada: requisições simultâneas com 401 aguardam a MESMA renovação.
let refreshPromise: Promise<void> | null = null

function refreshSession(client: AxiosInstance): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = client
      .post('/auth/refresh')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export function setupAuthInterceptor(client: AxiosInstance, options: AuthInterceptorOptions) {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableRequest | undefined
      const isSkipped = SKIP_REFRESH_PREFIXES.some((prefix) => original?.url?.startsWith(prefix))

      if (!original || error.response?.status !== 401 || original._retry || isSkipped) {
        return Promise.reject(error)
      }

      original._retry = true
      try {
        await refreshSession(client)
        return client(original)
      } catch {
        options.onSessionExpired()
        return Promise.reject(error)
      }
    },
  )
}
