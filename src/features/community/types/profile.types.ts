/**
 * Tipos da parte social (perfil + badges).
 * Atualizado após as mudanças de backend: data_cadastro, plano, badges em
 * destaque/progresso e níveis agora vêm de verdade da API.
 */

export interface PerfilUsuario {
  id: number
  nome: string
  username: string
  nome_exibicao: string | null
  username_social: string | null
  biografia_social: string | null
  localizacao_estado: string | null
  foto_perfil: string | null
  visibilidade: number
  plano: 'FREE' | 'PRO'
  data_cadastro: string
  xp_usuario: number
  nivel_total: number
  ranking_posicao: number
  total_seguidores: number
  total_seguindo: number
  total_badges: number
}

export interface Badge {
  id: number
  icone: string
  nome: string
  descricao: string
  xp: number
  /** ⚠️ Existe no banco (tbl_badge.id_categoria), mas ainda sem endpoint
   * pra listar os nomes das categorias — por isso o filtro por categoria
   * continua só visual no front por enquanto. */
  id_categoria?: number | null
}

export interface BadgeUsuario extends Badge {
  data_conquista: string
}

/** Badge ainda não conquistada, com progresso — vem de
 * GET /badge-usuario/progresso/:id_usuario. Só badges com criterio_tipo
 * conhecido aparecem aqui (ver backend). */
export interface BadgeEmProgresso extends Badge {
  progresso_atual: number
  progresso_total: number
}

export interface NivelInfo {
  nivel: number
  titulo: string
  xp_necessario: number
}

export type AbaPerfil = 'publicacoes' | 'respostas' | 'salvos' | 'arquivados'
