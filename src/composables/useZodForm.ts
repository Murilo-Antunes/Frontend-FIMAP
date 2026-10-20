import { reactive } from 'vue'
import type { ZodType } from 'zod'

/**
 * Validação de formulário com Zod: guarda uma mensagem de erro por campo
 * e permite aplicar os erros por campo devolvidos pela API.
 */
export function useZodForm<T>(schema: ZodType<T>) {
  const errors = reactive<Record<string, string | undefined>>({})

  function clearErrors() {
    Object.keys(errors).forEach((key) => delete errors[key])
  }

  function clearError(field: string) {
    delete errors[field]
  }

  /** Retorna os dados já tratados (trim, lowercase...) ou null se houver erros. */
  function validate(values: unknown): T | null {
    clearErrors()
    const result = schema.safeParse(values)
    if (result.success) return result.data

    for (const issue of result.error.issues) {
      const field = String(issue.path[0] ?? '')
      if (field && !errors[field]) errors[field] = issue.message
    }
    return null
  }

  function setServerErrors(campos?: Record<string, string>) {
    if (campos) Object.assign(errors, campos)
  }

  return { errors, validate, clearError, clearErrors, setServerErrors }
}
