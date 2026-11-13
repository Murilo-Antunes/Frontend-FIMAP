// src/features/metas/types/metas.types.ts

export type StatusMeta = 0 | 1 // 0 = pausada, 1 = ativa

export type PrazoMeta = 'curto' | 'medio' | 'longo'

/** Categoria de meta. id_usuario = null → categoria padrão do sistema (visível a todos). */
export interface CategoriaMeta {
  id: number
  nome: string
  id_usuario: number | null
}

/** Conta/conexão onde o aporte da meta é aplicado, com a taxa de rendimento (CDI) já resolvida. */
export interface ContaRendimento {
  id: number
  banco: string
  apelido: string
  /** Percentual do CDI (ex.: 1 = 100% do CDI). null = não foi possível identificar o rendimento. */
  percentualCdi: number | null
}

/** Formato "raw" que vem da API (campos em snake_case, como no DAO/Controller). */
export interface MetaApi {
  id: number
  nome: string
  descricao: string | null
  valor_inicio: number
  valor_desejado: number
  valor_total: number
  aporte_mensal: number
  data_alvo: string
  status: StatusMeta
  id_categoria: number
  id_conta_vinculada: number | null
  id_usuario?: number
}

/** Modelo usado no front (camelCase), depois de mapeado. */
export interface Meta {
  id: number
  nome: string
  descricao: string
  valorInicio: number
  valorDesejado: number
  valorTotal: number
  aporteMensal: number
  dataAlvo: Date
  status: StatusMeta
  idCategoria: number
  idContaVinculada: number | null
}

export interface CriarMetaPayload {
  nome: string
  descricao?: string
  valor_inicio: number
  valor_desejado: number
  valor_total: number
  aporte_mensal: number
  data_alvo: string
  status: StatusMeta
  id_categoria: number
  id_conta_vinculada?: number | null
}

export type AtualizarMetaPayload = Partial<CriarMetaPayload>

export interface CriarCategoriaPayload {
  nome: string
}
