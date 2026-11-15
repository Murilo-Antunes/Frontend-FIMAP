import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { getErrorMessage, isCanceled, simulatorService } from '../services/simulator.service'
import type { HistoryEntry, SimulationKind } from '../types/simulator.types'

const PAGE_SIZE = 12 // o backend aceita até 100

async function loadPage(
  kind: SimulationKind,
  pagina: number,
  signal: AbortSignal,
): Promise<HistoryEntry[]> {
  const params = { pagina, tamanho_pagina: PAGE_SIZE }
  if (kind === 'investimentos') {
    const records = await simulatorService.list('investimentos', params, signal)
    return records.map((data) => ({ kind: 'investimentos' as const, data }))
  }
  const records = await simulatorService.list('amortizacoes', params, signal)
  return records.map((data) => ({ kind: 'amortizacoes' as const, data }))
}

/**
 * Histórico paginado. Troca de `kind` cancela a requisição anterior e recarrega do zero:
 * investimentos → GET /investimentos; amortizacoes → GET /amortizacoes.
 * A API não devolve total; "tem mais" = a última página veio cheia.
 */
export function useSimulationHistory(kind: Ref<SimulationKind>) {
  const entries = ref<HistoryEntry[]>([])
  const status = ref<'loading' | 'ready' | 'error'>('loading')
  const errorMessage = ref('')
  const loadingMore = ref(false)
  const loadMoreError = ref('')
  const hasMore = ref(false)
  const deletingId = ref<number | null>(null)

  let page = 1
  let controller: AbortController | null = null

  async function fetchPage(reset: boolean): Promise<void> {
    controller?.abort()
    const current = new AbortController()
    controller = current
    const requested = kind.value
    const target = reset ? 1 : page + 1

    if (reset) {
      status.value = 'loading'
      entries.value = []
      hasMore.value = false
      errorMessage.value = ''
    } else {
      loadingMore.value = true
      loadMoreError.value = ''
    }

    try {
      const loaded = await loadPage(requested, target, current.signal)
      entries.value = reset ? loaded : [...entries.value, ...loaded]
      page = target
      hasMore.value = loaded.length === PAGE_SIZE
      status.value = 'ready'
    } catch (error) {
      if (isCanceled(error)) return
      const message = getErrorMessage(error, 'Não foi possível carregar suas simulações.')
      if (reset) {
        status.value = 'error'
        errorMessage.value = message
      } else {
        loadMoreError.value = message
      }
    } finally {
      if (controller === current) loadingMore.value = false
    }
  }

  const reload = () => fetchPage(true)
  const loadMore = () => (hasMore.value && !loadingMore.value ? fetchPage(false) : Promise.resolve())

  /** Retorna null em sucesso ou a mensagem de erro. */
  async function remove(entry: HistoryEntry): Promise<string | null> {
    deletingId.value = entry.data.id
    try {
      await simulatorService.remove(entry.kind, entry.data.id)
      entries.value = entries.value.filter(
        (item) => !(item.kind === entry.kind && item.data.id === entry.data.id),
      )
      return null
    } catch (error) {
      return getErrorMessage(error, 'Não foi possível excluir a simulação.')
    } finally {
      deletingId.value = null
    }
  }

  watch(kind, reload, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return {
    entries,
    status,
    errorMessage,
    loadingMore,
    loadMoreError,
    hasMore,
    deletingId,
    reload,
    loadMore,
    remove,
  }
}
