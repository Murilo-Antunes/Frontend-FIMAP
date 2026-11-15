import type {
  AmortizationMode,
  AmortizationSimulation,
  CalcSystem,
  InvestmentSimulation,
  SimulationKind,
  SimulationRecord,
} from '../types/simulator.types'

export const isInvestmentRecord = (record: SimulationRecord): record is InvestmentSimulation =>
  'valor_inicial' in record

export const isAmortizationRecord = (record: SimulationRecord): record is AmortizationSimulation =>
  'saldo_devedor' in record

export const isSimulationKind = (value: unknown): value is SimulationKind =>
  value === 'investimentos' || value === 'amortizacoes'

/** O banco guarda VARCHAR livre; valores desconhecidos caem no padrão em vez de quebrar a tela. */
export const asCalcSystem = (value: string): CalcSystem => (value === 'PRICE' ? 'PRICE' : 'SAC')

export const asAmortizationMode = (value: string): AmortizationMode =>
  value === 'REDUZIR_PARCELA' ? 'REDUZIR_PARCELA' : 'REDUZIR_PRAZO'
