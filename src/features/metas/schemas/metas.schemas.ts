// src/features/metas/schemas/metas.schemas.ts
import { z } from 'zod'

/** id sentinela usado só no front p/ representar o tile "Personalizado" ainda não criado. */
export const CATEGORIA_NOVA = 'nova' as const

export const metaFormSchema = z
  .object({
    categoriaId: z.union([z.number().int().positive(), z.literal(CATEGORIA_NOVA)], {
      required_error: 'Selecione uma categoria',
    }),
    categoriaPersonalizadaNome: z
      .string()
      .trim()
      .min(2, 'Dê um nome pra categoria')
      .max(80, 'Nome muito longo')
      .optional(),
    nomeObjetivo: z
      .string()
      .trim()
      .min(2, 'Informe um nome para o objetivo')
      .max(100, 'Nome muito longo'),
    descricao: z.string().trim().max(2000, 'Descrição muito longa').optional().or(z.literal('')),
    valorInicio: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .min(0, 'O valor não pode ser negativo'),
    dataAlvo: z.string().min(1, 'Selecione a data alvo'), // formato "YYYY-MM"
    aporteMensal: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .min(0, 'O valor não pode ser negativo'),
    valorDesejado: z.coerce
      .number({ invalid_type_error: 'Informe um valor' })
      .positive('A meta final deve ser maior que zero'),
    idContaVinculada: z.number().int().positive().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.categoriaId === CATEGORIA_NOVA && !data.categoriaPersonalizadaNome) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoriaPersonalizadaNome'],
        message: 'Dê um nome pra categoria personalizada',
      })
    }
    if (data.valorDesejado <= data.valorInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valorDesejado'],
        message: 'A meta final deve ser maior que o valor já economizado',
      })
    }
  })

export type MetaFormValues = z.infer<typeof metaFormSchema>
