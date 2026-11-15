import { z } from 'zod'
import { roundMoney } from '../lib/format'
import type { AmortizationPayload, InvestmentPayload } from '../types/simulator.types'

/** Limites do backend (controllers) e limites de UI. */
export const LIMITS = {
  nomeMax: 45, // VARCHAR(45) — o backend conta code points
  descricaoMax: 200, // limite de UI (backend aceita até 65535 bytes)
  moneyMax: 9_999_999_999_999.99,
  rateMax: 999.99,
  prazoMinMeses: 1,
  prazoMaxMeses: 600, // limite de UI: 50 anos (backend aceita até 2147483647)
} as const

const nome = z
  .string()
  .trim()
  .min(1, 'Informe um título para a simulação.')
  .refine((value) => [...value].length <= LIMITS.nomeMax, `Use no máximo ${LIMITS.nomeMax} caracteres.`)

const descricao = z.string().max(LIMITS.descricaoMax, `Use no máximo ${LIMITS.descricaoMax} caracteres.`)

const money = z
  .number()
  .min(0, 'O valor não pode ser negativo.')
  .max(LIMITS.moneyMax, 'Valor acima do limite permitido.')

const prazo = z
  .number()
  .int('Informe o prazo em meses inteiros.')
  .min(LIMITS.prazoMinMeses, 'O prazo mínimo é de 1 mês.')
  .max(LIMITS.prazoMaxMeses, `O prazo máximo é de ${LIMITS.prazoMaxMeses} meses.`)

/** a.a. em %: o cálculo exige 1 + taxa/100 > 0, por isso o piso de -99,99. */
const rate = z
  .number()
  .min(-99.99, 'A taxa deve ser maior que -100%.')
  .max(LIMITS.rateMax, `A taxa máxima é ${LIMITS.rateMax}%.`)

export const investmentSchema = z.object({
  nome,
  descricao,
  valor_inicial: money,
  aporte_mensal: money,
  prazo,
  rentabilidade: rate,
})

export const amortizationSchema = z.object({
  nome,
  descricao,
  saldo_devedor: money.refine((value) => value > 0, 'Informe um saldo devedor maior que zero.'),
  prazo,
  taxa: rate.min(0, 'A taxa não pode ser negativa.'),
  sistema_calculo: z.enum(['SAC', 'PRICE']),
  aporte_mensal: money,
  modalidade: z.enum(['REDUZIR_PRAZO', 'REDUZIR_PARCELA']),
})

export type FieldErrors = Partial<Record<string, string>>

export type FormValidation<TPayload> =
  | { ok: true; payload: TPayload }
  | { ok: false; errors: FieldErrors }

/** Campos numéricos do formulário podem estar vazios (null) → o Zod devolve invalid_type. */
function collectErrors(issues: readonly { path: readonly PropertyKey[]; code: string; message: string }[]) {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const field = String(issue.path[0] ?? '')
    if (field && !(field in errors)) {
      errors[field] = issue.code === 'invalid_type' ? 'Informe um valor válido.' : issue.message
    }
  }
  return errors
}

const emptyToNull = (text: string): string | null => (text.trim() === '' ? null : text.trim())

export interface InvestmentFormState {
  nome: string
  descricao: string
  valor_inicial: number
  aporte_mensal: number
  prazo: number
  rentabilidade: number | null
}

export interface AmortizationFormState {
  nome: string
  descricao: string
  saldo_devedor: number
  prazo: number
  taxa: number | null
  sistema_calculo: 'SAC' | 'PRICE'
  aporte_mensal: number
  modalidade: 'REDUZIR_PRAZO' | 'REDUZIR_PARCELA'
}

export function validateInvestment(form: InvestmentFormState): FormValidation<InvestmentPayload> {
  const result = investmentSchema.safeParse(form)
  if (!result.success) return { ok: false, errors: collectErrors(result.error.issues) }
  const data = result.data
  return {
    ok: true,
    payload: {
      nome: data.nome,
      descricao: emptyToNull(data.descricao),
      valor_inicial: roundMoney(data.valor_inicial),
      aporte_mensal: roundMoney(data.aporte_mensal),
      prazo: data.prazo,
      rentabilidade: roundMoney(data.rentabilidade),
    },
  }
}

export function validateAmortization(
  form: AmortizationFormState,
): FormValidation<AmortizationPayload> {
  const result = amortizationSchema.safeParse(form)
  if (!result.success) return { ok: false, errors: collectErrors(result.error.issues) }
  const data = result.data
  return {
    ok: true,
    payload: {
      nome: data.nome,
      descricao: emptyToNull(data.descricao),
      saldo_devedor: roundMoney(data.saldo_devedor),
      prazo: data.prazo,
      taxa: roundMoney(data.taxa),
      sistema_calculo: data.sistema_calculo,
      aporte_mensal: roundMoney(data.aporte_mensal),
      modalidade: data.modalidade,
    },
  }
}
