export type RecommendationType = 'economia_mensal' | 'investimento' | 'planejamento' | 'outros'
export interface Recommendation {
  id: number
  titulo: string
  mensagem: string
  area: 'nucleo' | 'investimentos'
  tipo: RecommendationType
  tipoLabel: string
  ativa: boolean
  expiraEm: number
  simulada?: boolean
  origem?: 'ia' | 'regra'
}
export interface RecommendationPage {
  agora: number
  recomendacoes: Recommendation[]
  proximo: number | null
  resumo: { total: number; ativas: number }
}
export const PREVIEW_CHARACTERS = 180

export function previewText(value: string, limit = PREVIEW_CHARACTERS): string {
  const characters = Array.from(value.trim().replace(/\s+/g, ' '))
  return characters.length <= limit ? characters.join('') : characters.slice(0, limit - 1).join('').trimEnd() + '…'
}
