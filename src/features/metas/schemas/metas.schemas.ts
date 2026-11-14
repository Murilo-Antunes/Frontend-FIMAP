// src/features/metas/schemas/metas.schemas.ts
import { z } from 'zod'

/** id sentinela usado só no front p/ representar o tile "Personalizado" ainda não criado. */
export const CATEGORIA_NOVA = 'nova' as const

export const metaFormSchema = z
  .object({
    categoriaId: z.union([z.number().int().positive(), z.literal(CATEGORIA_NOVA)], {
      required_error: 'Selecione uma categoria',
    }),
    // Sem .min(2) aqui de propósito: esse campo só importa quando categoriaId === CATEGORIA_NOVA.
    // Com categoria padrão, o ref fica como string vazia (não undefined), e .optional() só libera
    // undefined — então um .min(2) direto no campo barraria a validação mesmo pra categoria padrão.
    // O tamanho mínimo é checado no superRefine, só quando a categoria "Personalizado" é usada.
    categoriaPersonalizadaNome: z
      .string()
      .trim()
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
    if (data.categoriaId === CATEGORIA_NOVA) {
      const nome = data.categoriaPersonalizadaNome?.trim() ?? ''
      if (nome.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['categoriaPersonalizadaNome'],
          message: nome.length === 0 ? 'Dê um nome pra categoria personalizada' : 'Nome muito curto (mínimo 2 letras)',
        })
      }
    }
    if (data.valorDesejado <= data.valorInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valorDesejado'],
        message: 'A meta final deve ser maior que o valor já economizado',
      })
    }
    if (data.dataAlvo) {
      const [anoAlvo, mesAlvo] = data.dataAlvo.split('-').map(Number)
      const dataAlvoDate = new Date(anoAlvo, mesAlvo - 1, 1)
      const hoje = new Date()
      const dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      if (dataAlvoDate < dataAtual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dataAlvo'],
          message: 'A data alvo não pode ser anterior ao mês atual',
        })
      }
    }
  })

export type MetaFormValues = z.infer<typeof metaFormSchema>
