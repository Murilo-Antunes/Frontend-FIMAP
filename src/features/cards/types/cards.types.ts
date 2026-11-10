/**
 * Tipos do domínio "Cartões".
 *
 * Os tipos `*Api` espelham o JSON REAL do backend (sem envelope `sucesso`;
 * erros vêm como `{ erro }`; 202 = conexão ainda sincronizando).
 * Os tipos de domínio (`Cartao` etc.) são o que as telas consomem.
 */

export type BandeiraCartao = 'mastercard' | 'visa' | 'elo' | 'amex' | 'outra'

/** Tema visual do cartão. O backend não manda tema: ele é derivado no front. */
export type TemaCartao = 'black' | 'laranja' | 'vermelho' | 'azul' | 'verde' | 'roxo'

/* ------------------------------- Cartões ---------------------------------- */

/**
 * GET /v1/openfinance/financeiro/cartoes/:itemId
 *
 * `bandeira` e `numero` AINDA NÃO existem no backend: são opcionais aqui e o
 * front funciona sem eles (ver docs/cards-endpoints.md → "Campos sugeridos").
 */
export interface CartaoApi {
  id: string
  nome: string
  tipo: string
  subtipo: string | null
  saldo: number
  moeda: string
  instituicao: string | null
  limite: number | null
  limiteDisponivel: number | null
  dataVencimentoFatura: string | null
  dataFechamentoFatura: string | null
  faturaAberta: number
  diasParaFechamento: number | null
  diasParaVencimento: number | null
  /** Sugerido: conta.creditData?.brand */
  bandeira?: string | null
  /** Sugerido: conta.number (o front usa só os 4 últimos dígitos) */
  numero?: string | null
}

export interface ListarCartoesApi {
  atualizando: boolean
  total: number
  cartoes: CartaoApi[]
}

export interface Cartao {
  id: string
  nome: string
  instituicao: string | null
  moeda: string
  limite: number | null
  limiteDisponivel: number | null
  /** YYYY-MM-DD */
  vencimentoFatura: string | null
  fechamentoFatura: string | null
  faturaAberta: number
  diasParaVencimento: number | null
  /** Últimos 4 dígitos, quando o backend informar. */
  finalNumero: string | null
  bandeira: BandeiraCartao
  tema: TemaCartao
}

/* -------------------------------- Fatura ---------------------------------- */

export type StatusFatura = 'ABERTA' | 'FECHADA'

/** GET /v1/openfinance/financeiro/cartoes/:cartaoId/fatura?itemId= */
export interface FaturaCartao {
  valorFatura: number
  /** FATURA = veio de /bills; SALDO = fallback pelo saldo da conta */
  origemValor: 'FATURA' | 'SALDO'
  saldoEmAberto: number
  moeda: string
  vencimento: string | null
  fechamento: string | null
  status: StatusFatura
  diasParaVencimento: number | null
  diasParaFechamento: number | null
  valorMinimo: number | null
  permiteParcelamento: boolean | null
  limiteTotal: number | null
  limiteDisponivel: number | null
  limiteUtilizado: number | null
  bandeira: string | null
}

export interface FaturaApi {
  atualizando: boolean
  fatura: FaturaCartao
}

/* ------------------------- Gastos por categoria --------------------------- */

export interface GastoCategoria {
  categoriaId: string
  nome: string
  valor: number
}

export interface PeriodoFatura {
  /** YYYY-MM-DD */
  inicio: string
  fim: string
}

export interface GastosCategoriaApi {
  atualizando: boolean
  periodo: PeriodoFatura
  total: number
  categorias: GastoCategoria[]
}

/* ------------------------------ Transações -------------------------------- */

export type TipoTransacao = 'COMPRA' | 'CREDITO'

export interface TransacaoCartao {
  id: string
  estabelecimento: string
  descricao: string
  categoria: string
  categoriaId: string | null
  /** Sempre positivo; o sinal vem de `tipo`. */
  valor: number
  tipo: TipoTransacao
  moeda: string
  /** ISO 8601. O Pluggy costuma mandar meia-noite UTC (sem hora real). */
  data: string | null
  dataCompra: string | null
  pendente: boolean
  parcelas: { numero: number | null; total: number } | null
  faturaId: string | null
}

export interface TransacoesCartaoApi {
  atualizando: boolean
  total: number
  limite: number
  desde: string
  transacoes: TransacaoCartao[]
}

/* ------------------------- Resultado / estado de UI ------------------------ */

/** O backend responde 202 enquanto o Pluggy sincroniza. */
export type ResultadoApi<T> = { atualizando: true } | { atualizando: false; dados: T }

export type StatusRecurso = 'idle' | 'carregando' | 'sincronizando' | 'pronto' | 'erro'
