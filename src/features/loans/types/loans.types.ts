export type LoanStatus = 'ATIVO' | 'QUITADO' | 'INADIMPLENTE'

export type InstallmentStatus = 'PAGA' | 'PENDENTE' | 'AMORTIZADA'

/**
 * Formato bruto de GET /v1/openfinance/financeiro/emprestimos/:itemId.
 *
 * Campos marcados com (GAP) foram derivados pelo backend a partir de dados da Pluggy
 * que não vêm prontos (ver service) — não existem como campo simples na Loan da Pluggy.
 */
export interface LoanRaw {
  id: string
  nome: string
  tipo: string
  modalidade: string
  valorContratado: number
  saldoDevedor: number
  moeda: string
  vencimento: string
  parcelasPagas: number
  parcelasRestantes: number
  parcelaMensal: number | null
  status: LoanStatus | null
  /** (GAP) derivado de `interestRates[]` */
  taxaJurosMensal?: number | null
  /** (GAP) derivado de `firstInstallmentDueDate` + periodicidade */
  proximoVencimento?: string | null
  /** Regra de negócio própria do Fimap — não vem da Pluggy */
  descontoAntecipacaoPercentual?: number | null
}

export interface LoansApiResponse {
  sucesso?: boolean
  atualizando: boolean
  total: number
  emprestimos: LoanRaw[]
}

export interface LoanInstallmentRaw {
  numero: number
  vencimento: string
  valor: number
  status: InstallmentStatus
  dataPagamento?: string | null
}

export interface LoanPaidSummaryRaw {
  quantidade: number
  valorTotal: number
  numeroInicial: number
  numeroFinal: number
}

/** Formato de GET /v1/openfinance/financeiro/emprestimos/:itemId/:emprestimoId/detalhe */
export interface LoanDetailApiResponse {
  atualizando: boolean
  emprestimo?: LoanRaw
  totalParcelas?: number
  pendentes?: LoanInstallmentRaw[]
  amortizadas?: LoanInstallmentRaw[]
  pagas?: {
    itens: LoanInstallmentRaw[]
    limite: number
    total: number
    temMais: boolean
    resumoRestante: LoanPaidSummaryRaw | null
  }
}

/** View model consumido pelos componentes (já formatado/derivado). */
export interface Loan {
  id: string
  nome: string
  tipoLabel: string
  status: LoanStatus
  valorContratado: number
  saldoDevedor: number
  parcelaMensal: number
  taxaJurosMensal: number | null
  proximoVencimento: Date | null
  parcelasPagas: number
  parcelasRestantes: number
  totalParcelas: number
  progresso: number
}

export interface LoanInstallment {
  numero: number
  totalParcelas: number
  vencimento: Date
  valor: number
  status: InstallmentStatus
  dataPagamento: Date | null
  isProxima: boolean
  diasParaVencimento: number | null
  economiaEstimadaAntecipacao: number | null
}

export interface LoanPaidSummary {
  quantidade: number
  valorTotal: number
  numeroInicial: number
  numeroFinal: number
}

export interface LoanDetail {
  loan: Loan
  pendentes: LoanInstallment[]
  amortizadas: LoanInstallment[]
  pagasVisiveis: LoanInstallment[]
  pagasTemMais: boolean
  pagasResumoRestante: LoanPaidSummary | null
}

export interface LoanOpportunity {
  tag?: string
  titulo: string
  descricao: string
  primaryActionLabel: string
  secondaryActionLabel?: string
  destaque?: {
    sigla: string
    titulo: string
    subtitulo: string
    valor: string
  }
}