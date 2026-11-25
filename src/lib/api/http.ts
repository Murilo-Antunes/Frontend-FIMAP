import axios from 'axios'
import { env } from '@/config/env'
import { useSessionTokenStore } from '@/stores/session-token.store'

const baseConfig = {
  baseURL: env.apiUrl, // http://localhost:8080
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
}

export const http = axios.create(baseConfig)

// Isolated client for public auth routes; it never receives the session token.
export const publicHttp = axios.create(baseConfig)

export const browserSessionHttp = axios.create({ ...baseConfig, withCredentials: true, timeout: 5_000 })

// Injeta o access token (quando há sessão) — rotas protegidas exigem "Authorization: Bearer".
http.interceptors.request.use((config) => {
  // O cabeçalho JSON padrão não pode ser usado com FormData: o navegador precisa
  // definir multipart/form-data com o boundary correspondente ao corpo.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  const token = useSessionTokenStore().accessToken
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.delete('Authorization')
  return config
})

// Token expirado/inválido numa requisição autenticada → encerra a sessão em memória e volta ao login.
// Só age quando a requisição levou token, para não interferir em 401 de credenciais no próprio login.
http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config?.headers.has('Authorization')
    ) {
      // imports dinâmicos evitam dependência circular (router/stores → http)
      const [{ useAuthStore }, { router }] = await Promise.all([
        import('@/stores/auth.store'),
        import('@/router'),
      ])
      const session = useSessionTokenStore()
      if (error.config.headers.get('Authorization') !== `Bearer ${session.accessToken}`) {
        return Promise.reject(error)
      }

      const currentRoute = router.currentRoute.value
      const query = currentRoute.name === 'recomendacoes' ? { redirect: currentRoute.fullPath } : undefined
      useAuthStore().clearSession()
      await router.replace({ name: 'login', query })
    }
    return Promise.reject(error)
  },
)
