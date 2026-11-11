import { computed, onMounted, onScopeDispose, ref, shallowRef } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { listConnectionRefs } from '@/features/connection/services/connection-refs'
import { fetchInvestments } from '../services/investments.service'
import { buildSummary } from '../services/investments.mapper'
import type { PortfolioSummary } from '../types/investments.types'

/** Carrega os investimentos de TODAS as conexões do usuário e monta o resumo da carteira. */
export function useInvestmentsData() {
  const auth = useAuthStore()

  const summary = shallowRef<PortfolioSummary | null>(null)
  const itemIds = ref<string[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const partial = ref(false)
  /** Momento da última consulta bem-sucedida à API. */
  const fetchedAt = ref<number | null>(null)

  let controller: AbortController | null = null

  const hasAssets = computed(() => (summary.value?.assets.length ?? 0) > 0)

  async function load(): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    loading.value = true
    error.value = null
    partial.value = false

    try {
      const refs = await listConnectionRefs(auth.usuario?.id??0, signal)
      const results = await Promise.allSettled(refs.map((ref) => fetchInvestments(ref.itemId, signal)))
      if (signal.aborted) return

      const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
      if (refs.length > 0 && ok.length === 0) throw new Error('Não foi possível carregar seus investimentos.')

      itemIds.value = refs.map((r) => r.itemId)
      summary.value = buildSummary(ok)
      partial.value = ok.length < refs.length
      fetchedAt.value = Date.now()
    } catch (e) {
      if (axios.isCancel(e) || signal.aborted) return
      error.value = e instanceof Error && !axios.isAxiosError(e) ? e.message : toApiError(e).mensagem
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  onMounted(load)
  onScopeDispose(() => controller?.abort())

  return { summary, itemIds, hasAssets, loading, error, partial, fetchedAt, reload: load }
}
