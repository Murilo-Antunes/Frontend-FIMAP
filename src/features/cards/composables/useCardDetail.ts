import axios from 'axios'
import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { useCardsStore } from '@/stores/cards.store'
import { cardsService } from '../services/cards.service'
import type {
  FaturaCartao,
  GastoCategoria,
  ResultadoApi,
  StatusRecurso,
  TransacaoCartao,
} from '../types/cards.types'
import { mensagemDeErro } from '../utils/erro'
import { aguardarSincronizacao } from '../utils/polling'

interface Recurso<T> {
  dados: Ref<T>
  status: Ref<StatusRecurso>
  erro: Ref<string | null>
}

function criarRecurso<T>(inicial: T): Recurso<T> {
  return {
    dados: ref(inicial) as Ref<T>,
    status: ref<StatusRecurso>('idle'),
    erro: ref<string | null>(null),
  }
}

/**
 * Carrega fatura, gastos por categoria e transações de um cartão, cada um com
 * seu próprio estado (um falhar não derruba os outros). Enquanto o backend
 * responde "sincronizando" (202), repete a chamada. Cancela tudo quando o
 * cartão muda ou o componente é desmontado.
 */
export function useCardDetail(cartaoId: MaybeRefOrGetter<string | null | undefined>) {
  const cardsStore = useCardsStore()

  const fatura = criarRecurso<FaturaCartao | null>(null)
  const categorias = criarRecurso<GastoCategoria[]>([])
  const transacoes = criarRecurso<TransacaoCartao[]>([])

  let controlador: AbortController | null = null

  async function executar<T>(
    recurso: Recurso<T>,
    buscar: () => Promise<ResultadoApi<T>>,
    vazio: T,
    signal: AbortSignal,
  ): Promise<void> {
    recurso.status.value = 'carregando'
    recurso.erro.value = null
    recurso.dados.value = vazio
    try {
      const dados = await aguardarSincronizacao(buscar, {
        signal,
        onSincronizando: () => {
          recurso.status.value = 'sincronizando'
        },
      })
      if (signal.aborted) return
      recurso.dados.value = dados
      recurso.status.value = 'pronto'
    } catch (e) {
      if (signal.aborted || axios.isCancel(e)) return
      recurso.erro.value = mensagemDeErro(e)
      recurso.status.value = 'erro'
    }
  }

  async function carregar(): Promise<void> {
    controlador?.abort()
    const id = toValue(cartaoId)
    if (!id) return

    const ctrl = new AbortController()
    controlador = ctrl
    
    // Obter o itemId correto a partir do store de cartões
    const cartao = cardsStore.getById(id)
    const itemId = cartao?.itemId
    if (!itemId) {
       console.error('ItemId não encontrado para o cartão:', id);
       return;
    }

    await Promise.all([
      executar(fatura, () => cardsService.getInvoice(id, itemId, ctrl.signal), null, ctrl.signal),
      executar(categorias, () => cardsService.getCategorySpending(id, itemId, ctrl.signal), [], ctrl.signal),
      executar(transacoes, () => cardsService.getTransactions(id, itemId, ctrl.signal), [], ctrl.signal),
    ])
  }

  watch(() => toValue(cartaoId), () => void carregar(), { immediate: true })

  onScopeDispose(() => controlador?.abort())

  return { fatura, categorias, transacoes, recarregar: carregar }
}

