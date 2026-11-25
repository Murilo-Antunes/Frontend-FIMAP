import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/features/auth/services/auth.service'
import type { LoginPayload, Usuario } from '@/features/auth/types/auth.types'
import { useSessionTokenStore } from './session-token.store'

type SessionStatus = 'desconhecido' | 'autenticado' | 'anonimo'


export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const status = ref<SessionStatus>('desconhecido')
  const sessionToken = useSessionTokenStore()
  let browserSession = false
  let restoring: Promise<void> | undefined
  let ending: Promise<void> | undefined

  const isAuthenticated = computed(() => status.value === 'autenticado')

  function clearSession() {
    browserSession = false
    sessionToken.clear()
    usuario.value = null
    status.value = 'anonimo'
  }

  function setSession(current: Usuario, token: string, persisted: boolean) {
    browserSession = persisted
    sessionToken.setToken(token)
    usuario.value = current
    status.value = 'autenticado'
  }

  function restoreSession(): Promise<void> {
    if (status.value !== 'desconhecido') return Promise.resolve()
    restoring ??= authService.session()
      .then(({ usuario: current, access_token }) => {
        if (status.value === 'desconhecido') setSession(current, access_token, true)
      })
      .catch(() => {
        if (status.value === 'desconhecido') clearSession()
      })
      .finally(() => { restoring = undefined })
    return restoring
  }

  async function login(payload: LoginPayload) {
    const { usuario: logged, access_token: accessToken } = await authService.login(payload)
    const persisted = await authService.createBrowserSession(accessToken)
    setSession(logged, accessToken, persisted)
  }

  function logout(): Promise<void> {
    if (!browserSession) {
      clearSession()
      return Promise.resolve()
    }
    ending ??= authService.logout().then(clearSession).finally(() => { ending = undefined })
    return ending
  }

  return { usuario, status, isAuthenticated, restoreSession, login, logout, clearSession }
})
