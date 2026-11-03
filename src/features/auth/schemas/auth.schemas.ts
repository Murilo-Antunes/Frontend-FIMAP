import { z } from 'zod'
import { isValidCpf } from '@/lib/cpf'

const emailField = z.string().trim().toLowerCase().email('Informe um e-mail válido.')
const passwordField = z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.')

/** Login: a nova API aceita apenas e-mail como identificador. */
export const loginSchema = z.object({
  email: emailField,
  senha: z.string().min(1, 'Informe sua senha.'),
})

export const registerSchema = z.object({
  nome: z.string().trim().min(3, 'Informe seu nome completo.'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido.'),
  email: emailField,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/, 'Use de 3 a 30 caracteres: letras, números, "_" ou ".".'),
  senha: passwordField,
})

export const forgotEmailSchema = z.object({ email: emailField })

export const otpSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, 'Informe os 6 dígitos do código.'),
})

export const resetPasswordSchema = z
  .object({
    novaSenha: passwordField,
    confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não conferem.',
    path: ['confirmarSenha'],
  })
