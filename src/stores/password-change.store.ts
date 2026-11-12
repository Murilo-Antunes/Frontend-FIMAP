import { defineStore } from 'pinia'

/** Mesma validade do OTP no backend (5 minutos). */
const VERIFICATION_TTL_MS = 5 * 60 * 1000

/**
 * Guarda, SÓ EM MEMÓRIA, a senha atual confirmada em Configurações > Alterar Senha, para a
 * ResetPasswordView pular o OTP e enviá-la junto com a nova senha (o backend confere de novo).
 *
 * Os valores ficam em variáveis comuns, fora do state do Pinia, para a senha não aparecer
 * no devtools nem ser serializada. Recarregar a página limpa tudo (volta ao fluxo com OTP).
 */
export const usePasswordChangeStore = defineStore('password-change', () => {
  let verifiedUserId: number | null = null
  let verifiedAt = 0
  let currentPassword: string | null = null

  function markVerified(idUsuario: number, senhaAtual: string): void {
    verifiedUserId = idUsuario
    verifiedAt = Date.now()
    currentPassword = senhaAtual
  }

  function isVerified(idUsuario: number): boolean {
    return (
      verifiedUserId === idUsuario &&
      currentPassword !== null &&
      Date.now() - verifiedAt < VERIFICATION_TTL_MS
    )
  }

  /** Devolve a senha atual confirmada, ou `null` se não houver ou se já expirou. */
  function getCurrentPassword(idUsuario: number): string | null {
    return isVerified(idUsuario) ? currentPassword : null
  }

  function clear(): void {
    verifiedUserId = null
    verifiedAt = 0
    currentPassword = null
  }

  return { markVerified, isVerified, getCurrentPassword, clear }
})
