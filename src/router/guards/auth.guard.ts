import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Controla a navegação com base na sessão. Importante: é só experiência de uso;
 * a autorização real dos dados é feita pela API.
 */
export const authGuard: NavigationGuard = async (to) => {
  const auth = useAuthStore()

  if (auth.status === 'desconhecido') {
    await auth.restoreSession()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
}
