import type { MarketIndicators, RateOption } from '../types/simulator.types'
import { formatPercent, roundMoney } from './format'

/** Tolerância para reconhecer uma taxa salva como uma das opções (DECIMAL(5,2)). */
const MATCH_TOLERANCE = 0.005

const cdiPercent = (cdi: number, share: number) => roundMoney((cdi * share) / 100)
const ipcaPlus = (ipca: number, real: number) =>
  roundMoney(((1 + ipca / 100) * (1 + real / 100) - 1) * 100)

/**
 * Opções de "Rentabilidade Contratada" derivadas dos indicadores vindos da API.
 * Os múltiplos (ex.: 110% do CDI) são apenas atalhos; qualquer taxa pode ser digitada.
 */
export function buildRateOptions(indicators: MarketIndicators): RateOption[] {
  const options: RateOption[] = [100, 110, 120].map((share) => ({
    key: `cdi-${share}`,
    value: cdiPercent(indicators.cdi, share),
    label: '',
  }))
  options.forEach((option, index) => {
    option.label = `${formatPercent(option.value)}% ao ano (${[100, 110, 120][index]}% do CDI)`
  })

  for (const real of [5, 6]) {
    const value = ipcaPlus(indicators.ipca, real)
    options.push({
      key: `ipca-${real}`,
      value,
      label: `${formatPercent(value)}% ao ano (IPCA + ${real}%)`,
    })
  }

  const poupanca = roundMoney(indicators.poupanca)
  options.push({
    key: 'poupanca',
    value: poupanca,
    label: `${formatPercent(poupanca)}% ao ano (Poupança)`,
  })

  return options
}

export function findRateOption(options: RateOption[], value: number | null): RateOption | null {
  if (value === null) return null
  return options.find((option) => Math.abs(option.value - value) < MATCH_TOLERANCE) ?? null
}
