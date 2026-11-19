import { z } from 'zod'

export const NOME_EXIBICAO_MAX = 80
export const BIOGRAFIA_MAX = 250
export const LOCALIZACAO_MAX = 60
export const USERNAME_SOCIAL_MIN = 3
export const USERNAME_SOCIAL_MAX = 30

export const FOTO_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const FOTO_MAX_BYTES = 5 * 1024 * 1024

/** Tira espaços e o "@" inicial (o campo já mostra o "@" como prefixo) e deixa minúsculo. */
export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase()
}

export const usernameSocialSchema = z
  .string()
  .min(USERNAME_SOCIAL_MIN, `Use pelo menos ${USERNAME_SOCIAL_MIN} caracteres.`)
  .max(USERNAME_SOCIAL_MAX, `Use no máximo ${USERNAME_SOCIAL_MAX} caracteres.`)
  .regex(/^[a-z0-9._]+$/, 'Use apenas letras, números, ponto e sublinhado.')
  .refine(
    (v) => !/^[._]|[._]$/.test(v) && !/[._]{2,}/.test(v),
    'Não comece nem termine com ponto ou sublinhado, nem repita os dois em sequência.',
  )

export const socialProfileSchema = z.object({
  nome_exibicao: z
    .string()
    .trim()
    .min(2, 'Informe seu nome de exibição (mínimo 2 caracteres).')
    .max(NOME_EXIBICAO_MAX, `Use no máximo ${NOME_EXIBICAO_MAX} caracteres.`),
  username_social: z.string().transform(normalizeUsername).pipe(usernameSocialSchema),
  biografia_social: z
    .string()
    .trim()
    .max(BIOGRAFIA_MAX, `A biografia aceita até ${BIOGRAFIA_MAX} caracteres.`),
  localizacao_estado: z
    .string()
    .trim()
    .max(LOCALIZACAO_MAX, `Use no máximo ${LOCALIZACAO_MAX} caracteres.`),
})

export type SocialProfileValues = z.infer<typeof socialProfileSchema>
export type SocialProfileField = keyof SocialProfileValues
export type SocialProfileErrors = Partial<Record<SocialProfileField, string>>

export type SocialProfileValidation =
  | { ok: true; data: SocialProfileValues }
  | { ok: false; errors: SocialProfileErrors }

const FIELDS: readonly SocialProfileField[] = [
  'nome_exibicao',
  'username_social',
  'biografia_social',
  'localizacao_estado',
]

export function validateSocialProfile(values: Record<SocialProfileField, string>): SocialProfileValidation {
  const parsed = socialProfileSchema.safeParse(values)
  if (parsed.success) return { ok: true, data: parsed.data }

  const errors: SocialProfileErrors = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && (FIELDS as readonly string[]).includes(field)) {
      const key = field as SocialProfileField
      if (!errors[key]) errors[key] = issue.message
    }
  }
  return { ok: false, errors }
}

/** Valida o arquivo escolhido para a foto de perfil. Retorna a mensagem de erro ou `null`. */
export function validateProfilePhoto(file: File): string | null {
  if (!(FOTO_TIPOS_PERMITIDOS as readonly string[]).includes(file.type)) {
    return 'Formato não suportado. Envie uma imagem JPG, PNG ou WebP.'
  }
  if (file.size > FOTO_MAX_BYTES) {
    return 'A imagem passa de 5 MB. Escolha um arquivo menor.'
  }
  return null
}
