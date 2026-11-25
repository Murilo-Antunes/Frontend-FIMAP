import { z } from 'zod'

const recommendationTypeSchema = z.enum(['geral', 'economia_mensal', 'investimento', 'planejamento', 'outros'])
const originSchema = z.enum(['ia', 'regra'])
const timestampSchema = z.int().nonnegative().max(8_640_000_000_000_000)
const persistedIdSchema = z.int().positive()

const recommendationSchema = z.object({
  id: z.int(),
  titulo: z.string(),
  mensagem: z.string(),
  area: z.enum(['nucleo', 'investimentos']),
  tipo: recommendationTypeSchema,
  tipoLabel: z.string(),
  ativa: z.boolean(),
  expiraEm: timestampSchema,
  simulada: z.boolean().optional(),
  origem: originSchema.optional(),
})

export const recommendationPageSchema = z.object({
  agora: timestampSchema,
  recomendacoes: z.array(recommendationSchema.extend({ id: persistedIdSchema })),
  proximo: persistedIdSchema.nullable(),
  resumo: z.object({ total: z.int().nonnegative(), ativas: z.int().nonnegative() }),
})

export const recommendationPreviewSchema = z.object({
  versao: z.literal(1),
  simulado: z.literal(true),
  recomendacao: recommendationSchema.extend({
    id: z.int().negative(),
    simulada: z.literal(true),
    origem: originSchema,
  }),
})

export type RecommendationType = z.infer<typeof recommendationTypeSchema>
export type Recommendation = z.infer<typeof recommendationSchema>
export type RecommendationPage = z.infer<typeof recommendationPageSchema>
export type RecommendationPreview = z.infer<typeof recommendationPreviewSchema>

export const PREVIEW_CHARACTERS = 180

export function previewText(value: string, limit = PREVIEW_CHARACTERS): string {
  const characters = Array.from(value.trim().replace(/\s+/g, ' '))
  return characters.length <= limit ? characters.join('') : characters.slice(0, limit - 1).join('').trimEnd() + '…'
}
