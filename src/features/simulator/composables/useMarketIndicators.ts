import { onScopeDispose, ref } from 'vue'
import { isCanceled, simulatorService } from '../services/simulator.service'
import type { MarketIndicators } from '../types/simulator.types'

/** CDI / IPCA / poupança vindos da API (sem valores fixos no front). */
export function useMarketIndicators() {
  const indicators = ref<MarketIndicators | null>(null)
  const status = ref<'loading' | 'ready' | 'error'>('loading')
  const controller = new AbortController()

  async function load(): Promise<void> {
    status.value = 'loading'
    try {
      indicators.value = await simulatorService.indicators(controller.signal)
      status.value = 'ready'
    } catch (error) {
      if (isCanceled(error)) return
      status.value = 'error'
    }
  }

  void load()
  onScopeDispose(() => controller.abort())

  return { indicators, status, retry: load }
}
