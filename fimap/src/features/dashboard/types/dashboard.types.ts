/**
 * Tipos do dashboard. Os `*Api*`/`Dashboard*` em snake_case espelham a resposta de
 * GET /dashboard e GET /dashboard/evolucao. `CoreItem` é o modelo de exibição (camelCase).
 *
 * Valores `null` significam "sem base de comparação" (ex.: não há mês anterior, não há metas).
 */

export interface DashboardSummary {
  patrimonio: {
    total: number
    /** Patrimônio atual menos o fechamento do mês anterior (ou saldo líquido do mês, sem histórico). */
    variacao_mes: number
    variacao_mes_percentual: number | null
    contas_ativas: number
  }
  receita_mensal: { valor: number; variacao_percentual: number | null; progresso: number }
  despesas: { valor: number; variacao_percentual: number | null; progresso: number }
  limite_cartoes: { disponivel: number; percentual_disponivel: number }
  investido: { valor: number; percentual_meta: number | null }
}

export interface DashboardCoreData {
  cartoes: {
    total_faturas_abertas: number
    quantidade_cartoes: number
    dias_para_fechamento: number | null
  }
  contas: {
    saldo_total: number
    instituicoes: string[]
    conexoes_total: number
    todas_sincronizadas: boolean
  }
  carteira: {
    valor_total: number
    tipos_ativos: string[]
    quantidade_ativos: number
    rentabilidade_percentual: number | null
  }
  emprestimos: {
    parcela_mensal_total: number
    contratos_ativos: number
    parcelas_pagas: number | null
    parcelas_total: number | null
    em_dia: boolean
  }
}

/** Transação já pronta para exibição (a API devolve as 5 mais recentes). */
export interface DashboardTransaction {
  id: number
  descricao: string
  /** ISO 8601 */
  data: string
  tipo: 'receita' | 'despesa'
  /** Sempre positivo; o sinal vem de `tipo`. */
  valor: number
  categoria: string
  /** Nome da conta usada (ex.: "Conta Nubank"). */
  conta: string | null
}

export interface DashboardApiResponse {
  resumo: DashboardSummary
  nucleo: DashboardCoreData
  transacoes: DashboardTransaction[]
}

export type EvolutionPeriod = 'dia' | 'semana' | 'mes'

export interface EvolutionPoint {
  label: string
  receitas: number
  despesas: number
}

export interface EvolutionApiResponse {
  periodo: EvolutionPeriod
  pontos: EvolutionPoint[]
}

// ---- Modelos de exibição ------------------------------------------------------------------

export type CoreItemType = 'cartoes' | 'contas' | 'carteira' | 'emprestimos'

export interface CoreItem {
  id: string
  tipo: CoreItemType
  titulo: string
  descricao: string
  valor: number
  /** Texto após o valor, ex.: "/mês". */
  valorSufixo?: string
  detalhe: string
  detalheTom: 'neutro' | 'positivo'
}

export interface DashboardOverview {
  summary: DashboardSummary
  core: CoreItem[]
  transactions: DashboardTransaction[]
}
