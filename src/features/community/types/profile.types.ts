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
  /** O backend deve mandar true quando o perfil é privado e quem está vendo
   * ainda não tem conexão aprovada. Se não vier, usamos visibilidade === 0. */
  acesso_restrito?: boolean
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

export type AbaPerfil = 'publicacoes' | 'respostas' | 'salvos'

/* ----------------------- Configurações sociais ----------------------- */

export type QuemPodeComentar = 'todos' | 'seguidores' | 'ninguem'

export interface ConfiguracoesSociais {
  /** true = perfil público na comunidade (tbl_usuario.visibilidade = 1). */
  visibilidade: boolean
  quem_comenta: QuemPodeComentar
  notif_respostas_mencoes: boolean
  notif_topicos_ia: boolean
  notif_conquistas: boolean
}

/** Números do card "resumo" da tela de configurações. Cada campo pode vir null. */
export interface ResumoSocial {
  audiencia_visivel: number | null
  xp_semana: number | null
  percentil_ranking: number | null
  solicitacoes_pendentes: number
}

/* --------------------- Solicitação de acesso (privado) --------------------- */

export type EstadoSolicitacao = 'nenhuma' | 'pendente'
export type TipoSolicitacao = 'conexao' | 'seguir'

export interface SolicitacaoRecebida {
  id: number
  tipo: TipoSolicitacao
  data_criacao: string
  id_usuario: number
  nome_exibicao: string
  username_social: string | null
  foto_perfil: string | null
  nivel_total: number
}

export interface UsuarioBloqueado {
  id_usuario: number
  nome_exibicao: string
  username_social: string | null
  foto_perfil: string | null
  data_criacao: string
}
