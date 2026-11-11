import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import axios from 'axios'
import { fetchEvolution } from '../services/investments.service'
import { mergeEvolutions } from '../services/investments.mapper'
import type { EvolutionPeriod, EvolutionPoint } from '../types/investments.types'

/** Evolução patrimonial agregada. Refaz a consulta (cancelando a anterior) ao trocar período ou conexões. */
export function useEvolution(itemIds: Ref<string[]>) {
  const period = ref<EvolutionPeriod>('1a')
  const points = shallowRef<EvolutionPoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let controller: AbortController | null = null

  async function load(): Promise<void> {
    controller?.abort()
    if (itemIds.value.length === 0) {
      points.value = []
      return
    }
    controller = new AbortController()
    const { signal } = controller

    loading.value = true
    error.value = null
    try {
      const results = await Promise.allSettled(itemIds.value.map((id) => fetchEvolution(id, period.value, signal)))
      if (signal.aborted) return
      const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
      if (ok.length === 0) throw new Error('Evolução patrimonial indisponível no momento.')
      points.value = mergeEvolutions(ok)
    } catch (e) {
      if (axios.isCancel(e) || signal.aborted) return
      points.value = []
      error.value = e instanceof Error ? e.message : 'Evolução patrimonial indisponível no momento.'
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  watch([period, itemIds], load, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { period, points, loading, error, reload: load }
}
