import { http } from '@/lib/api/http'
import type { ExtratoCartao, ExtratoCartaoApi } from '../types/cards-statement.types'
import type {
  Cartao,
  CartaoApi,
  FaturaApi,
  FaturaCartao,
  GastosCategoriaApi,
  GastoCategoria,
  ListarCartoesApi,
  ResultadoApi,
  TransacaoCartao,
  TransacoesCartaoApi,
} from '../types/cards.types'
import { derivarBandeira, derivarTema } from '../utils/card-theme'

const BASE = '/v1/openfinance/financeiro/cartoes'

const SINCRONIZANDO: { atualizando: true } = { atualizando: true }

function ultimosDigitos(numero: string | null | undefined): string | null {
  const digitos = (numero ?? '').replace(/\D/g, '')
  return digitos.length >= 4 ? digitos.slice(-4) : null
}

export function mapearCartao(c: CartaoApi, indice: number, itemId: string): Cartao {
  return {
    id: c.id,
    itemId,
    nome: c.nome,
    instituicao: c.instituicao ?? null,
    moeda: c.moeda ?? 'BRL',
    limite: c.limite ?? null,
    limiteDisponivel: c.limiteDisponivel ?? null,
    vencimentoFatura: c.dataVencimentoFatura ?? null,
    fechamentoFatura: c.dataFechamentoFatura ?? null,
    faturaAberta: c.faturaAberta,
    diasParaVencimento: c.diasParaVencimento ?? null,
    finalNumero: ultimosDigitos(c.numero),
    bandeira: derivarBandeira(c.bandeira, c.nome),
    tema: derivarTema(c.nome, indice),
  }
}

export const cardsService = {
  async list(itemId: string, signal?: AbortSignal): Promise<ResultadoApi<Cartao[]>> {
    const resposta = await http.get<ListarCartoesApi>(`${BASE}/${encodeURIComponent(itemId)}`, { signal })
    if (resposta.status === 202 || resposta.data.atualizando) return SINCRONIZANDO

    return { atualizando: false, dados: resposta.data.cartoes.map((c, i) => mapearCartao(c, i, itemId)) }
  },

  async listAll(itemIds: string[], signal?: AbortSignal): Promise<ResultadoApi<Cartao[]>> {
    console.log('listAll itemIds type:', typeof itemIds, 'is Array:', Array.isArray(itemIds), 'Value:', itemIds);
    if (!Array.isArray(itemIds)) {
       console.error('listAll: itemIds is not an array!', itemIds);
       return { atualizando: false, dados: [] };
    }
    const responses = await Promise.all(itemIds.map((itemId) => this.list(itemId, signal)))
    const cartoes = responses.flatMap((res) => (res.atualizando ? [] : res.dados)).map((c, i) => ({ ...c, tema: derivarTema(c.nome, i) }))
    const atualizando = responses.some((res) => res.atualizando)
    
    return atualizando ? SINCRONIZANDO : { atualizando: false, dados: cartoes }
  },

  async getInvoice(
    cartaoId: string,
    itemId: string,
    signal?: AbortSignal,
  ): Promise<ResultadoApi<FaturaCartao>> {
    const resposta = await http.get<FaturaApi>(`${BASE}/${encodeURIComponent(cartaoId)}/fatura`, {
      params: { itemId },
      signal,
    })
    if (resposta.status === 202 || resposta.data.atualizando) return SINCRONIZANDO

    return { atualizando: false, dados: resposta.data.fatura }
  },

  async getCategorySpending(
    cartaoId: string,
    itemId: string,
    signal?: AbortSignal,
  ): Promise<ResultadoApi<GastoCategoria[]>> {
    const resposta = await http.get<GastosCategoriaApi>(
      `${BASE}/${encodeURIComponent(cartaoId)}/gastos-por-categoria`,
      { params: { itemId, periodo: 'fatura-atual' }, signal },
    )
    if (resposta.status === 202 || resposta.data.atualizando) return SINCRONIZANDO

    return { atualizando: false, dados: resposta.data.categorias }
  },

  async getTransactions(
    cartaoId: string,
    itemId: string,
    signal?: AbortSignal,
    limite = 20,
  ): Promise<ResultadoApi<TransacaoCartao[]>> {
    const resposta = await http.get<TransacoesCartaoApi>(
      `${BASE}/${encodeURIComponent(cartaoId)}/transacoes`,
      { params: { itemId, limite }, signal },
    )
    if (resposta.status === 202 || resposta.data.atualizando) return SINCRONIZANDO

    return { atualizando: false, dados: resposta.data.transacoes }
  },

  /**
   * Extrato completo de uma fatura do cartão.
   * Sem `mes`, a API devolve a fatura atual (e informa o mês em `periodoSelecionado`).
   */
  async getStatement(
    cartaoId: string,
    itemId: string,
    signal?: AbortSignal,
    mes?: string,
  ): Promise<ResultadoApi<ExtratoCartao>> {
    const resposta = await http.get<ExtratoCartaoApi>(
      `${BASE}/${encodeURIComponent(cartaoId)}/extrato`,
      { params: { itemId, ...(mes ? { mes } : {}) }, signal },
    )
    if (resposta.status === 202 || resposta.data.atualizando) return SINCRONIZANDO

    return { atualizando: false, dados: resposta.data }
  },
}
