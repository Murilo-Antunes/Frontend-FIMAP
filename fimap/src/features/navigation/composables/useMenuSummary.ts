import { ref } from 'vue'
import { menuService } from '../services/menu.service'
import type { MenuDescriptions } from '../types/menu.types'

const MIN_INTERVAL_MS = 60_000

/**
 * Descrições dinâmicas do menu lateral. Se a API falhar, o menu continua com os textos
 * estáticos de `config/navigation.ts` (não é motivo para travar a navegação).
 */
export function useMenuSummary() {
  const descriptions = ref<MenuDescriptions>({})
  const loading = ref(false)
  let lastLoadedAt = 0

  async function refresh(force = false) {
    if (loading.value || (!force && Date.now() - lastLoadedAt < MIN_INTERVAL_MS)) return
    loading.value = true
    try {
      descriptions.value = await menuService.getDescriptions()
      lastLoadedAt = Date.now()
    } catch {
      // mantém o que já estava na tela (ou o texto estático)
    } finally {
      loading.value = false
    }
  }

  return { descriptions, loading, refresh }
}
