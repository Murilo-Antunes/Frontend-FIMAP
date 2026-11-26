import { z } from 'zod'

const recommendationTypeSchema = z.enum(['geral', 'economia_mensal', 'investimento', 'planejamento', 'outros'])
const originSchema = z.enum(['ia', 'regra'])
const timestampSchema = z.int().nonnegative().max(8_640_000_000_000_000)
const persistedIdSchema = z.int().positive()

const recommendationSchema = z.object({
  id: z.int(),
  titulo: z.string(),
  mensagem: z.string(),
  acao: z.string().optional(),
  area: z.enum(['nucleo', 'investimentos']),
  tipo: recommendationTypeSchema,
  tipoLabel: z.string(),
  ativa: z.boolean(),
  expiraEm: timestampSchema,
  geradaEm: timestampSchema.optional(),
  simulada: z.boolean().optional(),
  origem: originSchema.optional(),
})

export const recommendationPageSchema = z.object({
  agora: timestampSchema,
  recomendacoes: z.array(recommendationSchema.extend({ id: persistedIdSchema })),
  proximo: persistedIdSchema.nullable(),
  resumo: z.object({ total: z.int().nonnegative(), ativas: z.int().nonnegative() }),
})

export type RecommendationType = z.infer<typeof recommendationTypeSchema>
export type Recommendation = z.infer<typeof recommendationSchema>
export type RecommendationPage = z.infer<typeof recommendationPageSchema>

export const PREVIEW_CHARACTERS = 180

export function previewText(value: string, limit = PREVIEW_CHARACTERS): string {
  const characters = Array.from(value.trim().replace(/\s+/g, ' '))
  return characters.length <= limit ? characters.join('') : characters.slice(0, limit - 1).join('').trimEnd() + '…'
}
