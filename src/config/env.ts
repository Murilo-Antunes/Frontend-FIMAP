/**
 * Acesso centralizado às variáveis de ambiente do frontend.
 * Somente valores públicos (prefixo VITE_). Nunca coloque segredos aqui.
 */
export const env = {
  /**
   * URL base da API backend (autenticação, cadastro, Open Finance, dashboard).
   * Todos os serviços apontam para o mesmo servidor; não há mais separação de clientes.
   */
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080',

  /** Mostra bancos de teste (Sandbox) no widget de conexão. Só em desenvolvimento. */
  pluggyIncludeSandbox: import.meta.env.VITE_PLUGGY_INCLUDE_SANDBOX === 'true',
} as const
