import axios from 'axios'
import { http } from '@/lib/api/http'
import { toApiError } from '@/lib/api/types/api-error'
import type {
  MarketIndicators,
  PageParams,
  SimulationKind,
  SimulationKindMap,
} from '../types/simulator.types'

/**
 * Base das rotas de simulação. Os controllers devolvem o corpo "cru" (array/objeto), sem o
 * envelope { sucesso, mensagem } — o service lê exatamente o que o backend envia.
 *
 * O backend identifica o titular pelo JWT anexado pelo interceptor HTTP.
 */
const BASE = '/v1/simulacoes'

type Record_<K extends SimulationKind> = SimulationKindMap[K]['record']
type Payload<K extends SimulationKind> = SimulationKindMap[K]['payload']

export const simulatorService = {
  async list<K extends SimulationKind>(
    kind: K,
    params: Required<PageParams>,
    signal?: AbortSignal,
  ): Promise<Record_<K>[]> {
    const { data } = await http.get<Record_<K>[]>(`${BASE}/${kind}`, {
      params,
      signal,
    })
    return data
  },

  async get<K extends SimulationKind>(
    kind: K,
    id: number,
    signal?: AbortSignal,
  ): Promise<Record_<K>> {
    const { data } = await http.get<Record_<K>>(`${BASE}/${kind}/${id}`, {
      signal,
    })
    return data
  },

  async create<K extends SimulationKind>(kind: K, payload: Payload<K>): Promise<Record_<K>> {
    const { data } = await http.post<Record_<K>>(`${BASE}/${kind}`, payload)
    return data
  },

  async update<K extends SimulationKind>(
    kind: K,
    id: number,
    payload: Payload<K>,
  ): Promise<Record_<K>> {
    const { data } = await http.patch<Record_<K>>(`${BASE}/${kind}/${id}`, payload)
    return data
  },

  async remove(kind: SimulationKind, id: number): Promise<void> {
    await http.delete(`${BASE}/${kind}/${id}`)
  },

  /** Endpoint sugerido (README-ALTERACOES §3): CDI, IPCA e poupança em % a.a. */
  async indicators(signal?: AbortSignal): Promise<MarketIndicators> {
    const { data } = await http.get<MarketIndicators>(`${BASE}/indicadores`, { signal })
    return data
  },
}

/** Requisição cancelada via AbortController — não é erro para o usuário. */
export const isCanceled = (error: unknown): boolean => axios.isCancel(error)

export const isNotFound = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404

/**
 * Ponto único de leitura de mensagem de erro.
 * Os controllers de simulação respondem `{ sucesso, mensagem }` (sem `codigo`), formato que o
 * toApiError trata como erro genérico — por isso a `mensagem` do corpo é lida aqui primeiro.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // Sem `response`: API fora do ar, URL errada (VITE_API_URL), CORS ou timeout.
    if (!error.response) {
      console.error('[simulador] sem resposta da API:', error.code, error.config?.url)
      return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.'
    }
    const { status, data } = error.response
    console.error('[simulador] erro HTTP', status, error.config?.method, error.config?.url, data)
    const mensagem = (data as { mensagem?: unknown } | undefined)?.mensagem
    return typeof mensagem === 'string' && mensagem ? mensagem : `${fallback} (HTTP ${status})`
  }
  // Erro de código (ex.: usuário não carregado no store) — não é da API.
  console.error('[simulador] erro inesperado:', error)
  return toApiError(error).mensagem || fallback
}
