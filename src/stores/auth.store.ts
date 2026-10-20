import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/features/auth/services/auth.service'
import type { LoginPayload, Usuario } from '@/features/auth/types/auth.types'

type SessionStatus = 'desconhecido' | 'autenticado' | 'anonimo'

/**
 * Estado de sessão para a experiência de navegação.
 * Os tokens ficam em cookies HttpOnly (invisíveis ao JS); aqui só há o usuário.
 */
export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const status = ref<SessionStatus>('desconhecido')

  const isAuthenticated = computed(() => status.value === 'autenticado')

  function clearSession() {
    usuario.value = null
    status.value = 'anonimo'
  }

  /** Confirma a sessão no backend (ex.: ao abrir/recarregar a aplicação). */
  async function restoreSession() {
    try {
      usuario.value = await authService.me()
      status.value = 'autenticado'
    } catch {
      clearSession()
    }
  }

  async function login(payload: LoginPayload) {
    usuario.value = await authService.login(payload)
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
