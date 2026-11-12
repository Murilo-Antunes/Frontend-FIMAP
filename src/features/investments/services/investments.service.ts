import { http } from '@/lib/api/http'
import type { EvolutionPeriod } from '../types/investments.types'
import { mapEvolution, mapInvestments } from './investments.mapper'

const BASE = '/v1/openfinance/financeiro'

export async function fetchInvestments(itemId: string, signal?: AbortSignal) {
  const { data } = await http.get<unknown>(`${BASE}/investimentos/${encodeURIComponent(itemId)}`, { signal })
  return mapInvestments(data)
}

export async function fetchAllInvestments(itemIds: string[], signal?: AbortSignal) {
  const responses = await Promise.all(itemIds.map((itemId) => fetchInvestments(itemId, signal)))
  return responses.flat()
}

/** ENDPOINT A CRIAR NO BACKEND — ver INTEGRACAO.md. */
export async function fetchEvolution(itemId: string, periodo: EvolutionPeriod, signal?: AbortSignal) {
  const { data } = await http.get<unknown>(`${BASE}/investimentos/${encodeURIComponent(itemId)}/evolucao`, {
    params: { periodo },
    signal,
  })
  return mapEvolution(data)
}
