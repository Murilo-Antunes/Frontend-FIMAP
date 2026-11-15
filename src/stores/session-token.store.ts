import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Access token JWT da sessão — SOMENTE em memória (Pinia).
 * Nunca persistir em localStorage/sessionStorage/cookies/URL (regra do projeto).
 */
export const useSessionTokenStore = defineStore('session-token', () => {
  const accessToken = ref<string | null>(null)

  function setToken(token: string): void {
    accessToken.value = token
  }

  function clear(): void {
    accessToken.value = null
  }

  return { accessToken, setToken, clear }
})
