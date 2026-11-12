import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cardsService } from '@/features/cards/services/cards.service'
import type { Cartao, StatusRecurso } from '@/features/cards/types/cards.types'
import { mensagemDeErro } from '@/features/cards/utils/erro'
import { aguardarSincronizacao } from '@/features/cards/utils/polling'

/**
 * Lista de cartões do usuário (só em memória, como o resto do estado do app).
 * Também guarda qual cartão deve receber o `view-transition-name` para a
 * animação entre "Selecionar cartão" e "Detalhe do cartão".
 */
export const useCardsStore = defineStore('cards', () => {
  const cartoes = ref<Cartao[]>([])
  const status = ref<StatusRecurso>('idle')
  const erro = ref<string | null>(null)
  const cartaoEmTransicaoId = ref<string | null>(null)

  let controlador: AbortController | null = null

  function getById(id: string | null | undefined): Cartao | null {
    if (!id) return null
    return cartoes.value.find((c) => c.id === id) ?? null
  }

  /** `itemIds` = conexões bancárias. */
  async function carregar(itemIds: string[], opcoes: { forcar?: boolean } = {}): Promise<void> {
    if (status.value === 'carregando' || status.value === 'sincronizando') return
    if (status.value === 'pronto' && !opcoes.forcar) return

    controlador?.abort()
    const ctrl = new AbortController()
    controlador = ctrl
    status.value = 'carregando'
    erro.value = null

    try {
      const lista = await aguardarSincronizacao(() => cardsService.listAll(itemIds, ctrl.signal), {
        signal: ctrl.signal,
        onSincronizando: () => {
          status.value = 'sincronizando'
        },
      })
      if (ctrl.signal.aborted) return
      cartoes.value = lista
      status.value = 'pronto'
    } catch (e) {
      if (ctrl.signal.aborted || axios.isCancel(e)) return
      erro.value = mensagemDeErro(e)
      status.value = 'erro'
    }
  }

  function marcarTransicao(id: string | null): void {
    cartaoEmTransicaoId.value = id
  }

  /** Chamar no logout. */
  function limpar(): void {
    controlador?.abort()
    controlador = null
    cartoes.value = []
    status.value = 'idle'
    erro.value = null
    cartaoEmTransicaoId.value = null
  }

  return { cartoes, status, erro, cartaoEmTransicaoId, getById, carregar, marcarTransicao, limpar }
})
