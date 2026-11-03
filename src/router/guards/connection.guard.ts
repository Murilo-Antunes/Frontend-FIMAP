import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectionStore } from '@/stores/connection.store'

/**
 * Rotas com `meta.requiresConnection` só abrem para quem já conectou uma conta bancária; quem
 * não conectou vai para a tela de conexão. Roda depois do authGuard (já há sessão confirmada).
 * Experiência de uso apenas: a autorização dos dados é da API.
 */
export const connectionGuard: NavigationGuard = async (to) => {
  
  if (!to.meta.requiresConnection) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) return true // o authGuard já cuida do login

  const connection = useConnectionStore()
  
  if (connection.status === 'desconhecido') {
    try {
      await connection.load()
    } catch (error) {
      console.error('ConnectionGuard - Erro ao carregar conexões:', error)
      // API fora do ar: deixa a tela abrir; ela mostra o erro e oferece "tentar novamente"
      return true
    }
  }

  const shouldRedirect = connection.status === 'sem_conexao'
  
  return shouldRedirect ? { name: 'connect-bank' } : true
}
