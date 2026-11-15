import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import {
  getErrorMessage,
  isCanceled,
  isNotFound,
  simulatorService,
} from '../services/simulator.service'
import type { SimulationKind, SimulationRecord } from '../types/simulator.types'

/**
 * Carrega a simulação existente quando a rota tem `id` (modo edição → PATCH).
 * Sem `id` (modo criação → POST) não faz requisição: o formulário começa em branco.
 */
export function useSimulationRecord(kind: Ref<SimulationKind>, id: Ref<number | null>) {
  const record = shallowRef<SimulationRecord | null>(null)
  const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('ready')
  const errorMessage = ref('')

  let loadedKey: string | null = null
  let controller: AbortController | null = null

  async function load(): Promise<void> {
    controller?.abort()
    const currentKind = kind.value
    const currentId = id.value

    if (currentId === null) {
      loadedKey = null
      record.value = null
      status.value = 'ready'
      return
    }

    const key = `${currentKind}:${currentId}`
    if (key === loadedKey) return // já adotado após salvar (evita refetch)

    const current = new AbortController()
    controller = current
    status.value = 'loading'
    errorMessage.value = ''
    record.value = null

    try {
      record.value =
        currentKind === 'investimentos'
          ? await simulatorService.get('investimentos', currentId, current.signal)
          : await simulatorService.get('amortizacoes', currentId, current.signal)
      loadedKey = key
      status.value = 'ready'
    } catch (error) {
      if (isCanceled(error)) return
      if (isNotFound(error)) {
        status.value = 'not-found'
      } else {
        status.value = 'error'
        errorMessage.value = getErrorMessage(error, 'Não foi possível carregar a simulação.')
      }
    }
  }

  /** Após um POST/PATCH bem-sucedido: usa a resposta como fonte da verdade, sem novo GET. */
  function adopt(savedKind: SimulationKind, saved: SimulationRecord): void {
    loadedKey = `${savedKind}:${saved.id}`
    record.value = saved
    status.value = 'ready'
  }

  function reload(): Promise<void> {
    loadedKey = null
    return load()
  }

  watch([kind, id], load, { immediate: true })
  onScopeDispose(() => controller?.abort())

  return { record, status, errorMessage, adopt, reload }
}
