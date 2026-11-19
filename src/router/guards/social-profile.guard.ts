import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useSocialProfileStore } from '@/stores/social-profile.store'

declare module 'vue-router' {
  interface RouteMeta {
    /** Exige perfil social completo; sem ele o usuário vai para "Criar perfil social". */
    requiresSocialProfile?: boolean
    /** Pede ao header (MainLayout) que mostre a seta de voltar. */
    showBack?: boolean
  }
}

/**
 * Registre DEPOIS do authGuard e do connectionGuard.
 * Só age em rotas com `meta.requiresSocialProfile`.
 */
export async function socialProfileGuard(
  to: RouteLocationNormalized,
): Promise<true | RouteLocationRaw> {
  if (!to.meta.requiresSocialProfile) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) return true // o authGuard já cuida do redirect

  const store = useSocialProfileStore()

  try {
    await store.load(Number(auth.usuario?.id??0))
  } catch {
    // Falha de rede não significa "sem perfil": deixa a view mostrar o erro com opção de tentar de novo.
    return true
  }

  if (store.hasSocialProfile()) return true

  return { name: 'community-profile', query: { redirect: to.fullPath } }
}
