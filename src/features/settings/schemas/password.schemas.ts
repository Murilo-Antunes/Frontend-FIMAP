import { z } from 'zod'

export const PASSWORD_MIN = 6
export const PASSWORD_MAX = 20

export const currentPasswordSchema = z.object({
  senhaAtual: z
    .string()
    .min(1, 'Informe sua senha atual.')
    .min(PASSWORD_MIN, `A senha deve ter no mínimo ${PASSWORD_MIN} caracteres.`)
    .max(PASSWORD_MAX, `A senha deve ter no máximo ${PASSWORD_MAX} caracteres.`),
})

export type CurrentPasswordForm = z.infer<typeof currentPasswordSchema>
