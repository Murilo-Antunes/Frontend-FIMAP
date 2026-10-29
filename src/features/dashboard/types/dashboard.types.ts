/**
 * Modelos de exibição do dashboard (camelCase/snake_case já prontos para os componentes).
 * Eles são montados em `services/dashboard.mapper.ts` a partir da resposta da API financeira
 * (ver `openfinance.types.ts`).
 *
 * Valores `null` significam "sem base de comparação/dado" (ex.: não há mês anterior).
 */

export interface DashboardSummary {
  patrimonio: {
    /** Patrimônio líquido (contas + investimentos - dívidas - fatura aberta). */
    total: number
    /**
     * Variação real do patrimônio no mês (atual - início do mês). `null` = indisponível: exige
     * histórico/saldo anterior que a API ainda não fornece.
     */
    variacao_mes: number | null
    variacao_mes_percentual: number | null
    /** Entradas - saídas do mês. É movimentação líquida, não variação patrimonial. */
    movimentacao_liquida_mes: number
    contas_ativas: number
  }
  receita_mensal: { valor: number; variacao_percentual: number | null; progresso: number }
  despesas: { valor: number; variacao_percentual: number | null; progresso: number }
  /** `limite_total` 0 = a instituição não informou limite: o card mostra a fatura em aberto. */
  limite_cartoes: {
    limite_total: number
    disponivel: number
    percentual_disponivel: number | null
    fatura_aberta: number
  }
  investido: {
    valor: number
    quantidade: number
    /** Parcela do patrimônio bruto (contas + investimentos) aplicada em investimentos. */
    participacao_percentual: number | null
  }
}

/** Transação pronta para exibição. */
export interface DashboardTransaction {
  id: string
  descricao: string
  /** ISO 8601 */
  data: string
  tipo: 'receita' | 'despesa'
  /** Sempre positivo; o sinal vem de `tipo`. */
  valor: number
  categoria: string
  /** Conta/cartão usado, com a instituição quando informada (ex.: "Nubank · Conta Corrente"). */
  conta: string | null
}

/** Períodos que o gráfico sabe exibir. A API atual só entrega `mes`. */
export type EvolutionPeriod = 'dia' | 'semana' | 'mes'

export interface EvolutionPoint {
  label: string
  receitas: number
  despesas: number
}

export type CoreItemType = 'cartoes' | 'contas' | 'carteira' | 'emprestimos'

export interface CoreItem {
  id: string
  tipo: CoreItemType
  titulo: string
  descricao: string
  /** `null` = indisponível (a API não informa), exibido como "—". */
  valor: number | null
  /** Texto após o valor, ex.: "/mês". */
  valorSufixo?: string
  detalhe: string
  detalheTom: 'neutro' | 'positivo'
}

export interface DashboardOverview {
  /** A API ainda está sincronizando: os números podem mudar em instantes. */
  updating: boolean
  summary: DashboardSummary
  core: CoreItem[]
  transactions: DashboardTransaction[]
  evolution: EvolutionPoint[]
}
