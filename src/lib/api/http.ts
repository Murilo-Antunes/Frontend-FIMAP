import axios from 'axios'
import { env } from '@/config/env'
import { useSessionTokenStore } from '@/stores/session-token.store'

export const http = axios.create({
  baseURL: env.apiUrl, // http://localhost:8080
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o access token (quando há sessão) — rotas protegidas exigem "Authorization: Bearer".
http.interceptors.request.use((config) => {
  const token = useSessionTokenStore().accessToken
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
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
      useSessionTokenStore().clear()
      await useAuthStore().logout()
      await router.replace({ name: 'login' })
    }
    return Promise.reject(error)
  },
)
