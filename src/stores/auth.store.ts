import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/features/auth/services/auth.service'
import type { LoginPayload, Usuario } from '@/features/auth/types/auth.types'

type SessionStatus = 'desconhecido' | 'autenticado' | 'anonimo'

/**
 * Estado de sessão do usuário.
 *
 * A nova API não usa cookies nem token persistido: o usuário fica apenas em memória.
 * Recarregar a página desloga (status volta para 'desconhecido' → guard chama
 * restoreSession() → session() retorna null → anonimo → redirect para login).
 *
 * Quando a autenticação server-side (cookie/JWT) for implementada no backend,
 * basta: (1) enviar withCredentials no http, (2) implementar authService.session()
 * consultando o endpoint real, (3) opcionalmente adicionar interceptor de refresh.
 */
export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const status = ref<SessionStatus>('desconhecido')

  const isAuthenticated = computed(() => status.value === 'autenticado')

  function clearSession() {
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
    const logged = await authService.login(payload)
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
