import { refDebounced } from '@vueuse/core'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { toApiError } from '@/lib/api/types/api-error'
import { useConnectionStore } from '@/stores/connection.store'
import { cardsService } from '../services/cards.service'
import type { ExtratoCartao } from '../types/cards-statement.types'
import {
  agruparPorDia,
  CATEGORIA_TODAS,
  filtrarLancamentos,
  listarCategorias,
} from '../utils/statement'

type StatusExtrato = 'carregando' | 'sincronizando' | 'pronto' | 'erro'

/** Enquanto o Pluggy sincroniza (202), tenta de novo a cada 3s por até ~30s. */
const INTERVALO_SINCRONIZACAO_MS = 3_000
const MAX_TENTATIVAS_SINCRONIZACAO = 10
const ATRASO_BUSCA_MS = 250

export function useCardStatement(cartaoId: () => string) {
  const connection = useConnectionStore()

  const dados = ref<ExtratoCartao | null>(null)
  const status = ref<StatusExtrato>('carregando')
  const erro = ref<string | null>(null)

  /** `null` = deixa a API escolher a fatura atual. */
  const mesSelecionado = ref<string | null>(null)
  const busca = ref('')
  const categoria = ref(CATEGORIA_TODAS)
  const buscaDebounced = refDebounced(busca, ATRASO_BUSCA_MS)

  let controlador: AbortController | null = null
  let temporizador: ReturnType<typeof setTimeout> | null = null

  function cancelar(): void {
    controlador?.abort()
    controlador = null
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }
  }

  async function buscar(tentativa: number): Promise<void> {
    const atual = new AbortController()
    controlador = atual

    try {
      const itemId = await connection.requireItemId()
      const resultado = await cardsService.getStatement(
        cartaoId(),
        itemId,
        atual.signal,
        mesSelecionado.value ?? undefined,
      )
      if (atual.signal.aborted) return

      if (resultado.atualizando) {
        if (tentativa >= MAX_TENTATIVAS_SINCRONIZACAO) {
          erro.value = 'Ainda estamos sincronizando seus dados com o banco. Tente novamente em instantes.'
          status.value = 'erro'
          return
        }
        status.value = 'sincronizando'
        temporizador = setTimeout(() => void buscar(tentativa + 1), INTERVALO_SINCRONIZACAO_MS)
        return
      }

      dados.value = resultado.dados
      erro.value = null
      status.value = 'pronto'
    } catch (e) {
      if (atual.signal.aborted) return
      erro.value = toApiError(e).mensagem
      status.value = 'erro'
    }
  }

  function recarregar(): void {
    cancelar()
    status.value = 'carregando'
    erro.value = null
    void buscar(0)
  }

  function selecionarMes(mes: string): void {
    if (mes === mesAtivo.value && status.value === 'pronto') return
    categoria.value = CATEGORIA_TODAS
    mesSelecionado.value = mes
  }

  function limparFiltros(): void {
    busca.value = ''
    categoria.value = CATEGORIA_TODAS
  }

  const mesAtivo = computed(() => mesSelecionado.value ?? dados.value?.periodoSelecionado ?? null)
  const meses = computed(() => dados.value?.periodos ?? [])
  const categorias = computed(() => listarCategorias(dados.value?.lancamentos ?? []))

  // Se o período novo não tem a categoria escolhida, volta para "Todos" sem refazer a requisição.
  const categoriaEfetiva = computed(() =>
    categorias.value.includes(categoria.value) ? categoria.value : CATEGORIA_TODAS,
  )

  const lancamentosFiltrados = computed(() =>
    filtrarLancamentos(dados.value?.lancamentos ?? [], {
      busca: buscaDebounced.value,
      categoria: categoriaEfetiva.value,
    }),
  )
  const grupos = computed(() => agruparPorDia(lancamentosFiltrados.value))
  const totalFiltrado = computed(() => lancamentosFiltrados.value.length)
  const temFiltroAtivo = computed(
    () => buscaDebounced.value.trim() !== '' || categoriaEfetiva.value !== CATEGORIA_TODAS,
  )

  // Trocou de cartão: zera tudo (a recarga é disparada pelo watch abaixo).
  watch(cartaoId, () => {
    dados.value = null
    mesSelecionado.value = null
    limparFiltros()
  })

  watch([cartaoId, mesSelecionado], recarregar, { immediate: true })

  onScopeDispose(cancelar)

  return {
    dados,
    status,
    erro,
    busca,
    categoria: categoriaEfetiva,
    mesAtivo,
    meses,
    categorias,
    grupos,
    totalFiltrado,
    temFiltroAtivo,
    selecionarMes,
    limparFiltros,
    recarregar,
    definirCategoria: (valor: string) => {
      categoria.value = valor
    },
  }
}
