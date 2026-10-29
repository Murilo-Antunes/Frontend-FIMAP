export interface ResumoFinanceiroApi {
  /** true enquanto a API ainda está sincronizando dados com as instituições. */
  atualizando: boolean
  patrimonio: {
    saldoContas: number
    totalInvestido: number
    saldoDevedor: number
    faturaAberta: number
    patrimonioLiquido: number
  }
  receitas: PeriodoComparadoApi
  despesas: PeriodoComparadoApi
  cartoes: {
    quantidade: number
    limiteTotal: number
    limiteDisponivel: number
    faturaAberta: number
    percentualDisponivel: number | null
  }
  investimentos: {
    quantidade: number
    valorAtual: number
    /** Chaves em inglês (ex.: FIXED_INCOME, EQUITY, ETF, MUTUAL_FUND, SECURITY). */
    porCategoria: Record<string, number>
    rentabilidadeAnualPercentual: number | null
  }
  emprestimos: {
    quantidade: number
    saldoDevedor: number
    parcelasMensais: number
  }
  evolucao: {
    /** Período pedido (`mes`, `semana`, `dia`). */
    periodo: string
    dados: EvolucaoItemApi[]
  }
  nucleoFinanceiro: {
    quantidadeContas: number
    instituicoes: string[]
  }
  resumo: {
    quantidadeContas: number
    quantidadeCartoes: number
    quantidadeInvestimentos: number
    quantidadeEmprestimos: number
  }
  ultimasTransacoes: TransacaoApi[]
}

export interface PeriodoComparadoApi {
  mesAtual: number
  mesAnterior: number
  variacaoPercentual: number | null
}

export interface TransacaoApi {
  id: string
  contaId: string
  contaNome: string | null
  descricao: string
  valor: number
  data: string
  tipo: string
  categoria: string | null
  status: string
  moeda: string
  instituicao: string | null
}
export interface EvolucaoItemApi {
  mes?: string
  periodo?: string
  receitas: number
  despesas: number
}

export interface ResumoEmAtualizacaoApi {
  atualizando: true
  mensagem?: string
}

export type ResumoApiResponse = ResumoFinanceiroApi | ResumoEmAtualizacaoApi

export const hasSummaryData = (data: ResumoApiResponse): data is ResumoFinanceiroApi =>
  'patrimonio' in data && Boolean(data.patrimonio)
