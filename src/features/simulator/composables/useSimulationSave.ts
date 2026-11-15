import { ref } from 'vue'
import { getErrorMessage, simulatorService } from '../services/simulator.service'
import type { SimulationKind, SimulationKindMap } from '../types/simulator.types'

export interface SaveFeedback {
  tone: 'success' | 'error'
  message: string
}

/**
 * Salva a simulação:
 * - `id === null` (veio de "Nova simulação")  → POST  → "Salvar Simulação"
 * - `id !== null` (simulação já existente)    → PATCH → "Salvar Alteração"
 */
export function useSimulationSave<K extends SimulationKind>(kind: K) {
  const saving = ref(false)
  const feedback = ref<SaveFeedback | null>(null)

  async function save(
    payload: SimulationKindMap[K]['payload'],
    id: number | null,
  ): Promise<SimulationKindMap[K]['record'] | null> {
    saving.value = true
    feedback.value = null
    try {
      const saved =
        id === null
          ? await simulatorService.create(kind, payload)
          : await simulatorService.update(kind, id, payload)
      feedback.value = {
        tone: 'success',
        message: id === null ? 'Simulação salva com sucesso.' : 'Alterações salvas com sucesso.',
      }
      return saved
    } catch (error) {
      feedback.value = {
        tone: 'error',
        message: getErrorMessage(error, 'Não foi possível salvar a simulação.'),
      }
      return null
    } finally {
      saving.value = false
    }
  }

  function clearFeedback(): void {
    feedback.value = null
  }

  return { saving, feedback, save, clearFeedback }
}
