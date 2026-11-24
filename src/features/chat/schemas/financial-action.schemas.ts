import { z } from 'zod'
import { amortizationSchema, investmentSchema } from '@/features/simulator/schemas/simulator.schemas'

const positiveId = z.number().int().positive()
const textList = z.array(z.string().trim().min(1).max(220)).max(8).default([])
const common = {
  id: z.string().uuid(),
  versao: positiveId,
  status: z.enum(['rascunho', 'pronta', 'salva']),
  nome: z.string().trim().max(100).nullish().transform(nome => nome || undefined),
  descricao: z.string().trim().max(2000).nullish(),
  justificativa: z.string().trim().min(1).max(420).optional(),
  premissas: textList,
  pendencias: textList,
  id_registro: positiveId.optional(),
}

const { aporte_mensal, prazo, valor_inicial } = investmentSchema.shape
export const goalProjectionSchema = z.object({
  valor_inicio: valor_inicial,
  valor_desejado: valor_inicial.positive(),
  aporte_mensal,
  prazo,
})
const goalDataSchema = goalProjectionSchema.extend({
  data_alvo: z.iso.date(),
  categoria: z.string().trim().min(1).max(80),
})
export const investmentProjectionSchema = investmentSchema.omit({ nome: true, descricao: true })
export const amortizationProjectionSchema = amortizationSchema.omit({ nome: true, descricao: true })

function isCompleteGoal(input: unknown) {
  const result = goalDataSchema.safeParse(input)
  return result.success && result.data.valor_desejado > result.data.valor_inicio
}

export const financialActionSchema = z.discriminatedUnion('tipo', [
  z.object({ ...common, tipo: z.literal('meta'), dados: goalDataSchema.partial() }),
  z.object({ ...common, tipo: z.literal('investimento'), dados: investmentProjectionSchema.partial() }),
  z.object({ ...common, tipo: z.literal('amortizacao'), dados: amortizationProjectionSchema.partial() }),
]).superRefine((action, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })

  if (action.nome === undefined && action.status !== 'rascunho') {
    issue('nome', 'Informe um nome para a proposta.')
  } else if (action.nome !== undefined) {
    const validName = action.tipo === 'meta'
      ? action.nome.length >= 2
      : investmentSchema.shape.nome.safeParse(action.nome).success
    if (!validName) issue('nome', 'Revise o nome da proposta.')
  }
  if (action.tipo !== 'meta' && (action.descricao?.length ?? 0) > 200) {
    issue('descricao', 'Revise a descrição da simulação.')
  }

  if ((action.status === 'salva') !== (action.id_registro !== undefined)) {
    issue('id_registro', 'O identificador do registro só é informado após o salvamento.')
  }
  if (action.status === 'rascunho') return

  const complete = action.tipo === 'meta'
    ? isCompleteGoal(action.dados)
    : action.tipo === 'investimento'
      ? investmentProjectionSchema.safeParse(action.dados).success
      : amortizationProjectionSchema.safeParse(action.dados).success

  if (!complete || action.pendencias.length) issue('dados', 'A proposta ainda tem dados pendentes.')
})

export type FinancialAction = z.infer<typeof financialActionSchema>

export function parseFinancialActions(input: unknown): FinancialAction[] | undefined {
  if (!Array.isArray(input)) return
  const actions: FinancialAction[] = []
  for (const item of input.slice(0, 3)) {
    const parsed = financialActionSchema.safeParse(item)
    if (parsed.success) actions.push(parsed.data)
  }
  return actions.length ? actions : undefined
}
