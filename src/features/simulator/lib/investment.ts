import type { InvestmentResult } from '../types/simulator.types'

export interface InvestmentInput {
  valorInicial: number
  aporteMensal: number
  prazoMeses: number
  /** % a.a. (ex.: 11.75) */
  rentabilidadeAa: number
  /** % a.a.; null quando o indicador não está disponível */
  poupancaAa: number | null
  ipcaAa: number | null
}

/** Taxa mensal equivalente (juros compostos) a partir da taxa anual em %. */
export const monthlyRate = (annualPercent: number): number =>
  Math.pow(1 + annualPercent / 100, 1 / 12) - 1

function isValid(input: InvestmentInput): boolean {
  return (
    [input.valorInicial, input.aporteMensal, input.prazoMeses, input.rentabilidadeAa].every(
      Number.isFinite,
    ) &&
    input.valorInicial >= 0 &&
    input.aporteMensal >= 0 &&
    Number.isInteger(input.prazoMeses) &&
    input.prazoMeses >= 1 &&
    1 + input.rentabilidadeAa / 100 > 0
  )
}

/**
 * Juros compostos com aporte no FIM de cada mês (anuidade ordinária) e taxa anual convertida
 * para mensal equivalente. Projeção bruta: não considera IR nem taxas.
 * Retorna null para entradas inválidas.
 */
export function calculateInvestment(input: InvestmentInput): InvestmentResult | null {
  if (!isValid(input)) return null

  const { valorInicial, aporteMensal, prazoMeses } = input
  const rate = monthlyRate(input.rentabilidadeAa)
  const savingsRate =
    input.poupancaAa !== null && 1 + input.poupancaAa / 100 > 0 ? monthlyRate(input.poupancaAa) : null

  let total = valorInicial
  let savings = valorInicial
  const serie: InvestmentResult['serie'] = [{ ano: 0, investido: valorInicial, total }]

  for (let month = 1; month <= prazoMeses; month++) {
    total = total * (1 + rate) + aporteMensal
    if (savingsRate !== null) savings = savings * (1 + savingsRate) + aporteMensal
    if (month % 12 === 0 || month === prazoMeses) {
      serie.push({ ano: month / 12, investido: valorInicial + aporteMensal * month, total })
    }
  }

  const aportes = valorInicial + aporteMensal * prazoMeses
  const ipcaValid = input.ipcaAa !== null && 1 + input.ipcaAa / 100 > 0

  return {
    total,
    aportes,
    juros: total - aportes,
    poupancaTotal: savingsRate === null ? null : savings,
    ganhoSobrePoupanca: savingsRate === null ? null : total - savings,
    rentabilidadeReal: ipcaValid
      ? ((1 + input.rentabilidadeAa / 100) / (1 + (input.ipcaAa as number) / 100) - 1) * 100
      : null,
    serie,
  }
}
