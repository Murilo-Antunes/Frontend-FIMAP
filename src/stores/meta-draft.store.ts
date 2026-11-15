import { ref } from 'vue'
import { defineStore } from 'pinia'

/** Rascunho de meta vindo de uma simulação (campos no mesmo formato camelCase do front de metas). */
export interface MetaDraft {
  origem: 'investimento' | 'amortizacao'
  nome: string
  descricao: string | null
  /** valor já economizado/aplicado no início (valor_inicio) */
  valorInicio: number
  /** valor que se quer alcançar (valor_desejado) */
  valorDesejado: number
  aporteMensal: number
  /** data-alvo em ISO 8601 (data_alvo) */
  dataAlvo: string
}

/**
 * Ponte simulação → tela de criação de meta. SOMENTE em memória (Pinia): nada em URL,
 * localStorage ou sessionStorage. A tela de meta chama `consume()` ao abrir, que devolve o
 * rascunho e o descarta — assim ele não reaparece numa próxima criação.
 */
export const useMetaDraftStore = defineStore('meta-draft', () => {
  const draft = ref<MetaDraft | null>(null)

  function set(value: MetaDraft): void {
    draft.value = value
  }

  function consume(): MetaDraft | null {
    const current = draft.value
    draft.value = null
    return current
  }

  return { draft, set, consume }
})
