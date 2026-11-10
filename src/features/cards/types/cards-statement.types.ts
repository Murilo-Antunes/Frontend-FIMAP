/**
 * Contrato do endpoint de extrato do cartão:
 * GET /v1/openfinance/financeiro/cartoes/:cartaoId/extrato?itemId=&mes=YYYY-MM
 */

export type TipoCartaoExtrato = 'fisico' | 'virtual'
export type StatusFaturaExtrato = 'aberta' | 'fechada' | 'paga'
export type TipoLancamento = 'compra' | 'pagamento'
export type ModalidadeLancamento = 'credito' | 'recorrente'
export type StatusLancamento = 'confirmado' | 'pendente'

export interface CartaoExtrato {
  id: string
  nome: string
  finalNumero: string | null
  instituicao: string | null
  tipo: TipoCartaoExtrato
}

export interface FaturaExtrato {
  valorTotal: number
  /** Data de vencimento no formato YYYY-MM-DD. */
  vencimento: string
  status: StatusFaturaExtrato
}

export interface LancamentoExtrato {
  id: string
  descricao: string
  categoria: string
  /** Slug do ícone (ex.: "supermercado", "combustivel"). Opcional: o front cai no ícone da categoria. */
  icone: string | null
  /** ISO 8601 com horário, ou YYYY-MM-DD quando a instituição não informa a hora. */
  data: string
  /** Sempre positivo. O sinal visual é decidido por `tipo`. */
  valor: number
  tipo: TipoLancamento
  modalidade: ModalidadeLancamento | null
  parcelaAtual: number | null
  totalParcelas: number | null
  status: StatusLancamento
}

export interface ExtratoCartao {
  cartao: CartaoExtrato
  fatura: FaturaExtrato
  /** Meses disponíveis (YYYY-MM), do mais recente para o mais antigo. */
  periodos: string[]
  /** Mês que a API efetivamente devolveu (YYYY-MM). */
  periodoSelecionado: string
  lancamentos: LancamentoExtrato[]
}

export interface ExtratoCartaoApi extends ExtratoCartao {
  sucesso: boolean
  atualizando?: boolean
}

export interface GrupoLancamentos {
  chave: string
  rotulo: string
  lancamentos: LancamentoExtrato[]
}
