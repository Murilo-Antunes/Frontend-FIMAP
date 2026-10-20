/**
 * Acesso centralizado às variáveis de ambiente do frontend.
 * Somente valores públicos (prefixo VITE_). Nunca coloque segredos aqui.
 */
export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000',
} as const
