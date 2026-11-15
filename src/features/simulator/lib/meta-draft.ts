import type { MetaDraft } from '@/stores/meta-draft.store'
import { roundMoney } from './format'
import type { AmortizationResult, InvestmentResult } from '../types/simulator.types'

/**
 * Nome da rota de criação de meta (kebab-case, como no resto do projeto).
 * ⚠️ Ajuste aqui se a rota de "nova meta" tiver outro nome — é o único ponto de uso.
 */
export const META_CREATE_ROUTE = 'metas-criar'

/** Hoje + N meses, em ISO 8601 (formato esperado por data_alvo). */
function inMonths(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

const cleanDescription = (value: string): string | null => value.trim() || null

interface InvestmentForm {
  nome: string
  descricao: string
  valor_inicial: number
  aporte_mensal: number
  prazo: number
}

/**
 * Investimento → meta de acumular o total projetado:
 * começa com o aporte inicial, soma o aporte mensal e vence no fim do prazo simulado.
 */
export function investmentToMetaDraft(form: InvestmentForm, result: InvestmentResult): MetaDraft {
  return {
    origem: 'investimento',
    nome: form.nome.trim(),
    descricao: cleanDescription(form.descricao),
    valorInicio: form.valor_inicial,
    valorDesejado: roundMoney(result.total),
    aporteMensal: form.aporte_mensal,
    dataAlvo: inMonths(form.prazo),
  }
}

interface AmortizationForm {
  nome: string
  descricao: string
  saldo_devedor: number
  aporte_mensal: number
}

/**
 * Amortização → meta de quitar a dívida:
 * objetivo = saldo devedor, aporte = aporte extraordinário, data = quitação projetada.
 */
export function amortizationToMetaDraft(
  form: AmortizationForm,
  result: AmortizationResult,
): MetaDraft {
  return {
    origem: 'amortizacao',
    nome: form.nome.trim(),
    descricao: cleanDescription(form.descricao),
    valorInicio: 0,
    valorDesejado: form.saldo_devedor,
    aporteMensal: form.aporte_mensal,
    dataAlvo: inMonths(result.meses),
  }
}
