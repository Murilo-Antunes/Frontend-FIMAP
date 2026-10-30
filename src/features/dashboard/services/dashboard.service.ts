import { financeHttp } from '@/lib/api/finance-http'
import type { DashboardOverview, EvolutionPeriod, EvolutionPoint } from '../types/dashboard.types'
import { hasSummaryData, type ResumoApiResponse } from '../types/openfinance.types'
import { buildEvolution, buildOverview } from './dashboard.mapper'

async function fetchSummary(
  itemId: string,
  period: EvolutionPeriod,
  signal?: AbortSignal,
): Promise<ResumoApiResponse> {
  const { data } = await financeHttp.get<ResumoApiResponse>('/v1/openfinance/financeiro/resumo', {
    params: { itemId, periodo: period },
    signal,
  })
  return data
}

/**
 * Comunicação com GET /v1/openfinance/financeiro/resumo?itemId=...&periodo=dia|semana|mes.
 * O `itemId` é o da conexão bancária do usuário (ver connection.store). Não há endpoint só da
 * evolução: trocar o período do gráfico busca o resumo de novo e usa apenas `evolucao`.
 * Erros do Axios sobem para a view.
 *
 * `null` = a API ainda está sincronizando e não devolveu números (tente de novo daqui a pouco).
 */
export const dashboardService = {
  async getOverview(
    itemId: string,
    period: EvolutionPeriod = 'mes',
    signal?: AbortSignal,
  ): Promise<DashboardOverview | null> {
    const data = await fetchSummary(itemId, period, signal)
    return hasSummaryData(data) ? buildOverview(data) : null
  },

  async getEvolution(
    itemId: string,
    period: EvolutionPeriod,
    signal?: AbortSignal,
  ): Promise<EvolutionPoint[] | null> {
    const data = await fetchSummary(itemId, period, signal)
    return hasSummaryData(data) ? buildEvolution(data) : null
  },
}
