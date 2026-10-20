const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** 1234.5 -> "R$ 1.234,50" */
export const formatCurrency = (value: number): string => currency.format(value)

/** Número sem símbolo: inteiros sem casas (12.450), demais com 2 casas (5.820,30). */
export const formatNumber = (value: number): string =>
  Number.isInteger(value) ? integer.format(value) : decimal.format(value)

/** 1240.8 -> "+R$ 1.240,80" | -50 -> "-R$ 50,00" */
export const formatSignedCurrency = (value: number): string =>
  `${value < 0 ? '-' : '+'}${formatCurrency(Math.abs(value))}`

/** 2.6 -> "2,6%" | com signed: "+2,6%" / "-12%" */
export function formatPercent(value: number, options: { signed?: boolean } = {}): string {
  const abs = Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  const sign = value < 0 ? '-' : options.signed && value > 0 ? '+' : ''
  return `${sign}${abs}%`
}
