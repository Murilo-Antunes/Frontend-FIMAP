const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlInt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const compactLong = new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'long' })

export const formatBRL = (value: number): string => brl.format(value)
export const formatBRLInt = (value: number): string => brlInt.format(value)
/** "R$ 10 mil", "R$ 1 milhão" */
export const formatBRLCompactLong = (value: number): string => `R$ ${compactLong.format(value)}`

export function formatPercent(value: number, digits = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

/**
 * Converte texto digitado em número. Aceita "1.234,56", "1234,56", "1234.56" e "R$ 1.000".
 * Retorna null quando não há número interpretável.
 */
export function parseDecimalBR(raw: string): number | null {
  const clean = raw.replace(/[^\d,.-]/g, '')
  if (!clean || clean === '-' || clean === ',' || clean === '.') return null

  let normalized: string
  if (clean.includes(',')) {
    normalized = clean.replace(/\./g, '').replace(',', '.')
  } else {
    const parts = clean.split('.')
    // "1234.5" / "1234.56" = decimal; "1.234" / "1.234.567" = separador de milhar
    normalized = parts.length === 2 && parts[1].length <= 2 ? clean : clean.replace(/\./g, '')
  }
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "11 anos e 10 meses", "1 ano", "7 meses" */
export function formatDuration(months: number): string {
  const total = Math.max(0, Math.round(months))
  const years = Math.floor(total / 12)
  const rest = total % 12
  if (years === 0) return plural(rest, 'mês', 'meses')
  if (rest === 0) return plural(years, 'ano', 'anos')
  return `${plural(years, 'ano', 'anos')} e ${plural(rest, 'mês', 'meses')}`
}

/** "5 ANOS", "1 ANO", "18 MESES" — selo dos cards do histórico */
export function formatPrazoBadge(months: number): string {
  if (months % 12 === 0) return plural(months / 12, 'ANO', 'ANOS')
  return plural(months, 'MÊS', 'MESES')
}

/** "5 Anos (60 meses)" — simulador de investimentos */
export function formatPrazoAnosMeses(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12
    return `${years} ${years === 1 ? 'Ano' : 'Anos'} (${plural(months, 'mês', 'meses')})`
  }
  return `${formatDuration(months)} (${plural(months, 'mês', 'meses')})`
}

/** "240 meses (20 Anos)" — simulador de amortização */
export function formatPrazoMesesAnos(months: number): string {
  const base = plural(months, 'mês', 'meses')
  return months >= 12 ? `${base} (${formatDuration(months)})` : base
}

/** Rótulo de ano para o eixo dos gráficos: 0 → "Ano 0", 1.5 → "Ano 1,5" */
export function formatYearLabel(year: number): string {
  return Number.isInteger(year)
    ? `Ano ${year}`
    : `Ano ${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(year)}`
}
