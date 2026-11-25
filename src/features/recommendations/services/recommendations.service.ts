import { http } from '@/lib/api/http'
import {
  recommendationPageSchema,
  recommendationPreviewSchema,
  type RecommendationPage,
  type RecommendationPreview,
  type RecommendationType,
} from '../types/recommendations.types'

export async function listRecommendations(options: {
  before?: number
  type?: RecommendationType
  signal?: AbortSignal
} = {}): Promise<RecommendationPage> {
  const { data } = await http.get<unknown>('/v1/ia/recomendacoes', {
    params: { antes: options.before, tipo: options.type }, signal: options.signal,
  })
  const result = recommendationPageSchema.safeParse(data)
  if (!result.success) throw new Error('Resposta de recomendações inválida.')

  const cursor = result.data.proximo
  if (options.before !== undefined && cursor !== null && cursor >= options.before) {
    throw new Error('Resposta de recomendações inválida.')
  }
  return result.data
}

export async function createRecommendationPreview(signal?: AbortSignal): Promise<RecommendationPreview> {
  const { data } = await http.post<unknown>('/v1/ia/recomendacoes/testar', {}, { signal })
  const result = recommendationPreviewSchema.safeParse(data)
  if (!result.success) throw new Error('Resposta do teste de recomendações inválida.')
  return result.data
}
