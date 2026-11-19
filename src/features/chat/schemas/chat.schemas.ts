import { z } from 'zod'

export const chatMessageSchema = z.object({
  pergunta: z.string().trim().min(1, 'Digite uma pergunta.').max(2000, 'Use até 2.000 caracteres.'),
})
