/**
 * O login respondeu 200, mas a requisição seguinte não trouxe o cookie de sessão de volta.
 * Quase sempre é o navegador descartando o cookie (SameSite/Secure em API de outro domínio,
 * bloqueio de cookies de terceiros no Safari) ou a origem do front fora de CORS_ORIGINS.
 */
export class SessionNotPersistedError extends Error {
  constructor() {
    super(
      'Login realizado, mas o navegador não guardou a sessão. Verifique CORS_ORIGINS na API e se o ' +
        'navegador permite cookies de terceiros (no Safari, use a API no mesmo domínio do site).',
    )
    this.name = 'SessionNotPersistedError'
  }
}
