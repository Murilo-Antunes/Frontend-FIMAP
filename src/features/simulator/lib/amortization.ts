import type { AmortizationMode, AmortizationResult, CalcSystem } from '../types/simulator.types'
import { monthlyRate } from './investment'

export interface AmortizationInput {
  saldoDevedor: number
  prazoMeses: number
  /** % a.a. (ex.: 9.5) */
  taxaAa: number
  sistema: CalcSystem
  /** aporte extraordinário mensal (0 = sem amortização extra) */
  extraMensal: number
  modalidade: AmortizationMode
}

interface Schedule {
  meses: number
  jurosTotal: number
  /** média das parcelas contratuais (sem o aporte extra) */
  parcelaMedia: number
  /** saldo devedor após cada mês; índice 0 = saldo inicial */
  saldoPorMes: number[]
}

const EPSILON = 0.005 // meio centavo

/** Parcela fixa da Tabela Price. */
function pmt(saldo: number, rate: number, months: number): number {
  return rate === 0 ? saldo / months : (saldo * rate) / (1 - Math.pow(1 + rate, -months))
}

/**
 * Simula o contrato mês a mês. O aporte extra é aplicado depois da parcela do mês.
 * - REDUZIR_PRAZO: parcela/amortização contratual se mantém; o saldo acaba antes.
 * - REDUZIR_PARCELA: o prazo original é mantido e a parcela é recalculada todo mês sobre o saldo.
 */
function simulate(
  saldoInicial: number,
  prazo: number,
  rate: number,
  sistema: CalcSystem,
  extra: number,
  modalidade: AmortizationMode,
): Schedule {
  let saldo = saldoInicial
  let jurosTotal = 0
  let totalParcelas = 0
  const saldoPorMes = [saldoInicial]

  const amortizacaoSac = saldoInicial / prazo
  const parcelaPrice = pmt(saldoInicial, rate, prazo)

  for (let mes = 1; mes <= prazo && saldo > EPSILON; mes++) {
    const restantes = prazo - mes + 1
    const jurosMes = saldo * rate

    let amortizacao: number
    if (sistema === 'SAC') {
      amortizacao = modalidade === 'REDUZIR_PARCELA' ? saldo / restantes : amortizacaoSac
    } else {
      const parcela = modalidade === 'REDUZIR_PARCELA' ? pmt(saldo, rate, restantes) : parcelaPrice
      amortizacao = parcela - jurosMes
    }
    amortizacao = Math.min(amortizacao, saldo)

    const extraAplicado = Math.min(extra, saldo - amortizacao)
    saldo -= amortizacao + extraAplicado

    jurosTotal += jurosMes
    totalParcelas += amortizacao + jurosMes
    saldoPorMes.push(saldo < EPSILON ? 0 : saldo)
  }

  const meses = saldoPorMes.length - 1
  return { meses, jurosTotal, parcelaMedia: meses > 0 ? totalParcelas / meses : 0, saldoPorMes }
}

function isValid(input: AmortizationInput): boolean {
  return (
    [input.saldoDevedor, input.prazoMeses, input.taxaAa, input.extraMensal].every(Number.isFinite) &&
    input.saldoDevedor > 0 &&
    Number.isInteger(input.prazoMeses) &&
    input.prazoMeses >= 1 &&
    input.taxaAa >= 0 &&
    input.extraMensal >= 0
  )
}

/** Saldo no mês `month` (0 depois da quitação). */
const balanceAt = (schedule: Schedule, month: number): number => schedule.saldoPorMes[month] ?? 0

/**
 * Compara o contrato original com o contrato acelerado pelo aporte extra.
 * Taxa anual convertida para mensal equivalente. Retorna null para entradas inválidas.
 *
 * CET efetivo (definição usada na tela): juros pagos ÷ saldo inicial ÷ prazo original em anos.
 * É uma métrica comparativa do custo do crédito sobre o principal, não o CET regulamentar.
 */
export function calculateAmortization(input: AmortizationInput, interval: 1 | 12 = 12): AmortizationResult | null {
  if (!isValid(input)) return null

  const { saldoDevedor, prazoMeses, sistema, modalidade } = input
  const rate = monthlyRate(input.taxaAa)

  const original = simulate(saldoDevedor, prazoMeses, rate, sistema, 0, modalidade)
  const accelerated = simulate(saldoDevedor, prazoMeses, rate, sistema, input.extraMensal, modalidade)

  const economia = original.jurosTotal - accelerated.jurosTotal
  const anosContrato = prazoMeses / 12
  const cet = (juros: number) => (juros / saldoDevedor / anosContrato) * 100

  const lastMonth = Math.ceil(prazoMeses / interval) * interval
  const serie: AmortizationResult['serie'] = []
  for (let month = 0; month <= lastMonth; month += interval) {
    serie.push({
      ano: month / 12,
      comAporte: balanceAt(accelerated, month),
      semAporte: balanceAt(original, month),
    })
  }

  return {
    meses: accelerated.meses,
    mesesOriginal: original.meses,
    mesesEconomizados: original.meses - accelerated.meses,
    parcelaMedia: accelerated.parcelaMedia,
    parcelaMediaOriginal: original.parcelaMedia,
    jurosTotal: accelerated.jurosTotal,
    jurosTotalOriginal: original.jurosTotal,
    economia,
    jurosEliminadosPct: original.jurosTotal > 0 ? (economia / original.jurosTotal) * 100 : 0,
    cetEfetivo: cet(accelerated.jurosTotal),
    cetEfetivoOriginal: cet(original.jurosTotal),
    serie,
    quitacaoAno: Math.ceil(accelerated.meses / 12),
  }
}
