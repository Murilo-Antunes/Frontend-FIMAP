export type SimulationKind = 'investimentos' | 'amortizacoes'

export type CalcSystem = 'SAC' | 'PRICE'
export type AmortizationMode = 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'

/** Registro retornado pela API (DECIMAL já serializado como number). `prazo` é sempre em MESES. */
export interface InvestmentSimulation {
  id: number
  nome: string
  descricao: string | null
  valor_inicial: number
  aporte_mensal: number
  prazo: number
  rentabilidade: number // % a.a.
  data_criacao: string
}

export interface AmortizationSimulation {
  id: number
  nome: string
  descricao: string | null
  saldo_devedor: number
  prazo: number
  taxa: number // % a.a.
  sistema_calculo: CalcSystem
  aporte_mensal: number // aporte extraordinário recorrente
  modalidade: AmortizationMode
  data_criacao: string
}

export type SimulationRecord = InvestmentSimulation | AmortizationSimulation

/** Payloads aceitos pelo POST/PATCH (sem id e data_criacao). */
export type InvestmentPayload = Omit<InvestmentSimulation, 'id' | 'data_criacao'>
export type AmortizationPayload = Omit<AmortizationSimulation, 'id' | 'data_criacao'>

/** Relaciona cada tipo de simulação ao seu registro e payload (usado pelo service tipado). */
export interface SimulationKindMap {
  investimentos: { record: InvestmentSimulation; payload: InvestmentPayload }
  amortizacoes: { record: AmortizationSimulation; payload: AmortizationPayload }
}

/** Item do histórico: união discriminada para o card saber o que renderizar. */
export type HistoryEntry =
  | { kind: 'investimentos'; data: InvestmentSimulation }
  | { kind: 'amortizacoes'; data: AmortizationSimulation }

export interface PageParams {
  pagina?: number
  tamanho_pagina?: number
}

/** GET /v1/simulacoes/indicadores (ver README-ALTERACOES: endpoint sugerido). Valores em % a.a. */
export interface MarketIndicators {
  cdi: number
  ipca: number
  poupanca: number
}

export interface TermOption {
  label: string
  /** prazo em meses */
  months: number
}

export interface RateOption {
  key: string
  label: string
  value: number
}

// ---- resultados dos cálculos ----
export interface InvestmentResult {
  total: number
  aportes: number
  juros: number
  /** null quando o indicador de poupança não está disponível */
  poupancaTotal: number | null
  ganhoSobrePoupanca: number | null
  /** % a.a. acima do IPCA (negativo = abaixo da inflação); null sem indicador de IPCA */
  rentabilidadeReal: number | null
  /** Tempo em anos. A série pode ter pontos mensais ou anuais. */
  serie: { ano: number; investido: number; total: number }[]
}

export interface AmortizationResult {
  meses: number
  mesesOriginal: number
  mesesEconomizados: number
  parcelaMedia: number
  parcelaMediaOriginal: number
  jurosTotal: number
  jurosTotalOriginal: number
  economia: number
  jurosEliminadosPct: number
  /** custo efetivo anual: juros pagos ÷ saldo inicial ÷ prazo original (anos), em % a.a. */
  cetEfetivo: number
  cetEfetivoOriginal: number
  /** Saldos devedores com tempo em anos. A série pode ter pontos mensais ou anuais. */
  serie: { ano: number; comAporte: number; semAporte: number }[]
  /** ano (1-based) em que o saldo zera com o aporte extra */
  quitacaoAno: number
}
