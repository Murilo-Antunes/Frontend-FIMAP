import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/features/auth/services/auth.service'
import type { LoginPayload, Usuario } from '@/features/auth/types/auth.types'
import { useSessionTokenStore } from './session-token.store'

type SessionStatus = 'desconhecido' | 'autenticado' | 'anonimo'

/**
 * Estado de sessão do usuário.
 *
 * O usuário e o token de acesso ficam em memória.
 * Recarregar a página exige um novo login.
 */
export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const status = ref<SessionStatus>('desconhecido')
  const sessionToken = useSessionTokenStore()

  const isAuthenticated = computed(() => status.value === 'autenticado')

  function clearSession() {
    sessionToken.clear()
    usuario.value = null
    status.value = 'anonimo'
  }

  /**
   * Tenta restaurar a sessão ao abrir/recarregar a aplicação.
   * Sem persistência server-side: sempre resulta em `anonimo`.
   * Mantemos a chamada para facilitar a transição quando o backend implementar sessão.
   */
  async function restoreSession() {
    try {
      const current = await authService.session()
      if (current) {
        usuario.value = current
        status.value = 'autenticado'
      } else {
        clearSession()
      }
    } catch {
      clearSession()
    }
  }

  async function login(payload: LoginPayload) {
    const { usuario: logged, access_token } = await authService.login(payload)
    sessionToken.setToken(access_token)
    usuario.value = logged
    status.value = 'autenticado'
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }

  return { usuario, status, isAuthenticated, restoreSession, login, logout, clearSession }
})
