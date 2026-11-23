import axios from 'axios'
import { env } from '@/config/env'
import { useSessionTokenStore } from '@/stores/session-token.store'

const PROTECTED_PREFIXES = [
  '/v1/ia/chats',
  '/v1/ia/chat',
  '/v1/ia/recomendacoes',
  '/v1/openfinance/connect-token',
  '/v1/openfinance/conexoes',
  '/v1/openfinance/contas-rendimento',
  '/v1/openfinance/financeiro',
  '/v1/openfinance/metas',
  '/v1/configuracoes',
  '/v1/notificacoes',
  '/v1/comunidade/posts',
  '/v1/comunidade/curtida',
  '/v1/comunidade/denuncia',
  '/v1/comunidade/denuncias',
  '/v1/comunidade/badge',
  '/v1/comunidade/seguir',
  '/v1/comunidade/niveis',
]

const PROTECTED_USER_ROUTES: Array<{ method: string; prefix: string }> = [
  { method: 'post', prefix: '/v1/openfinance/usuario/alterar/verificar-senha-atual/' },
  { method: 'patch', prefix: '/v1/openfinance/usuario/usuario-update/' },
  { method: 'patch', prefix: '/v1/openfinance/usuario/alterar/senha-atual/' },
  { method: 'post', prefix: '/v1/openfinance/usuario/foto-perfil/' },
  { method: 'delete', prefix: '/v1/openfinance/usuario/foto-perfil/' },
  { method: 'get', prefix: '/v1/openfinance/usuario/usuario/id/' },
  { method: 'delete', prefix: '/v1/openfinance/usuario/usuario-delete/' },
]

function requiresAuth(url: string | undefined, method: string | undefined, baseURL: string | undefined): boolean {
  if (!url) return false
  let pathname = url
  try {
    pathname = new URL(url, baseURL).pathname
  } catch {
    // Axios normally provides a relative URL; keep it as-is if URL parsing fails.
  }
  const normalizedMethod = (method ?? 'get').toLowerCase()
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return PROTECTED_USER_ROUTES.some(
    (route) => route.method === normalizedMethod && pathname.startsWith(route.prefix),
  )
}

export const http = axios.create({
  baseURL: env.apiUrl, // http://localhost:8080
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

// Envia o JWT somente às rotas protegidas informadas pelo backend.
http.interceptors.request.use((config) => {
  const token = useSessionTokenStore().accessToken
  if (requiresAuth(config.url, config.method, config.baseURL) && token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  } else {
    config.headers.delete('Authorization')
  }
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
