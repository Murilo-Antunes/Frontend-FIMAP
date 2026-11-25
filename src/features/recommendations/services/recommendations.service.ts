import { http } from '@/lib/api/http'
import type { Recommendation, RecommendationPage, RecommendationType } from '../types/recommendations.types'

export async function listRecommendations(options: {
  before?: number
  type?: RecommendationType
  signal?: AbortSignal
} = {}): Promise<RecommendationPage> {
  const { data } = await http.get<RecommendationPage>('/v1/ia/recomendacoes', {
    params: { antes: options.before, tipo: options.type }, signal: options.signal,
  })
  if (!Array.isArray(data.recomendacoes) || !data.resumo ||
    !Number.isFinite(data.resumo.total) || !Number.isFinite(data.resumo.ativas)) {
    throw new Error('Resposta de recomendações inválida.')
  }
  return data
}

export async function createRecommendationPreview(signal?: AbortSignal): Promise<{
  versao: 1
  simulado: true
  recomendacao: Recommendation
}> {
  const { data } = await http.post('/v1/ia/recomendacoes/testar', {}, { signal })
  const card = data?.recomendacao
  if (data?.simulado !== true || card?.simulada !== true ||
    !['ia', 'regra'].includes(card.origem) || typeof card.mensagem !== 'string' || typeof card.titulo !== 'string') {
    throw new Error('Resposta do teste de recomendações inválida.')
  }
  return data
}
