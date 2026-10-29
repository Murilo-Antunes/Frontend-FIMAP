import { env } from '@/config/env'
import { financeHttp } from '@/lib/api/finance-http'
import type { DashboardOverview, EvolutionPeriod, EvolutionPoint } from '../types/dashboard.types'
import { hasSummaryData, type ResumoApiResponse } from '../types/openfinance.types'
import { buildEvolution, buildOverview } from './dashboard.mapper'

/** Erro de configuração: o dashboard não sabe qual conexão financeira consultar. */
export class FinanceItemNotConfiguredError extends Error {
  constructor() {
    super('Conexão financeira não configurada. Defina VITE_FINANCE_ITEM_ID no arquivo .env.')
    this.name = 'FinanceItemNotConfiguredError'
  }
}

async function fetchSummary(period: EvolutionPeriod, signal?: AbortSignal): Promise<ResumoApiResponse> {
  if (!env.financeItemId) throw new FinanceItemNotConfiguredError()
  const { data } = await financeHttp.get<ResumoApiResponse>('/v1/openfinance/financeiro/resumo', {
    params: { itemId: env.financeItemId, periodo: period },
    signal,
  })
  return data
}

export const dashboardService = {
  async getOverview(period: EvolutionPeriod = 'mes', signal?: AbortSignal): Promise<DashboardOverview | null> {
    const data = await fetchSummary(period, signal)
    return hasSummaryData(data) ? buildOverview(data) : null
  },

  async getEvolution(period: EvolutionPeriod, signal?: AbortSignal): Promise<EvolutionPoint[] | null> {
    const data = await fetchSummary(period, signal)
    return hasSummaryData(data) ? buildEvolution(data) : null
  },
}
