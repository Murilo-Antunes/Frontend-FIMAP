/**
 * @deprecated Use `http` de `@/lib/api/http` diretamente.
 * Re-export mantido temporariamente para não quebrar imports existentes enquanto
 * a migração não foi aplicada em todos os serviços. Remova este arquivo após ajustar
 * connection.service e dashboard.service.
 */
export { http as financeHttp } from './http'
