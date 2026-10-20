import { http } from '@/lib/api/http'
import type {
  DashboardApiResponse,
  DashboardOverview,
  EvolutionApiResponse,
  EvolutionPeriod,
  EvolutionPoint,
} from '../types/dashboard.types'
import { buildCoreItems } from './dashboard.mapper'

/** Comunicação com GET /dashboard e GET /dashboard/evolucao. Erros do Axios sobem para a view. */
export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await http.get<DashboardApiResponse>('/dashboard')
    return {
      summary: data.resumo,
      core: buildCoreItems(data.nucleo),
      transactions: data.transacoes,
    }
  },

  async getEvolution(period: EvolutionPeriod): Promise<EvolutionPoint[]> {
    const { data } = await http.get<EvolutionApiResponse>('/dashboard/evolucao', {
      params: { periodo: period },
    })
    return data.pontos
  },
}
