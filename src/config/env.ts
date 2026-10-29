/**
 * Acesso centralizado às variáveis de ambiente do frontend.
 * Somente valores públicos (prefixo VITE_). Nunca coloque segredos aqui.
 */
export const env = {
  /** API de autenticação/cadastro (login, criar conta, recuperar senha). */
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000',

  /** API financeira (Open Finance), usada pelo dashboard. Por enquanto sem autenticação. */
  financeApiUrl: (import.meta.env.VITE_FINANCE_API_URL as string | undefined) ?? 'http://localhost:8080',

  /**
   * TEMPORÁRIO: identificador (`itemId`) da conexão financeira consultada pela API financeira.
   * Enquanto ela não tiver autenticação, vem daqui; depois deve vir do usuário logado.
   */
  financeItemId: (import.meta.env.VITE_FINANCE_ITEM_ID as string | undefined) ?? '',
} as const
