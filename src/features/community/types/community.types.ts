/**
 * Tipos da feature "community" (perfil social + feed de posts).
 * Os formatos de resposta seguem os controllers do backend; os campos marcados
 * como "PROPOSTO" dependem das alterações listadas em FIMAP-social-integracao.md.
 */

/* ------------------------------ Perfil social ------------------------------ */

export interface PerfilSocial {
  id: number
  nome_exibicao: string | null
  username_social: string | null
  biografia_social: string | null
  localizacao_estado: string | null
  foto_perfil: string | null
}

/** Corpo do PATCH /v1/openfinance/usuario/usuario-update/:id_usuario */
export interface PerfilSocialPayload {
  nome_exibicao?: string
  username_social?: string
  biografia_social?: string
  localizacao_estado?: string
}

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

/* --------------------------------- Badges --------------------------------- */

export interface Badge {
  id: number
  nome: string
  descricao: string
  icone: string
  xp: number
  /** PROPOSTO: 1 quando a badge está em destaque no perfil */
  destaque?: boolean | number
}

/* ---------------------------------- Posts ---------------------------------- */

export type ConteudoTipo = 'texto' | 'foto' | 'video'

export interface ConteudoItem {
  tipo: ConteudoTipo
  valor: string
}

/** PROPOSTO: autor embutido em todo post devolvido pela API */
export interface PostAutor {
  id: number
  nome_exibicao: string | null
  username_social: string | null
  foto_perfil: string | null
}

export interface Post {
  id: number
  data_criacao: string
  data_atualizacao: string | null
  status: 'ativo' | 'inativo'
  id_usuario: number
  conteudo: ConteudoItem[]
  autor: PostAutor
  /** PROPOSTO: contagens e estado do usuário logado, embutidos no feed e em /buscar/:id_post */
  total_curtidas: number
  total_comentarios: number
  curtiu: boolean
}

/** Resposta de POST /alternar-curtida-* (existente). */
export interface CurtidaResult {
  curtiu: boolean
  total_curtidas: number
}

/** Comentário em árvore. `autor`, `total_curtidas` e `curtiu` são PROPOSTOS (ver guia). */
export interface Comentario {
  id: number
  mensagem: string
  data_criacao: string
  id_usuario: number
  id_post: number
  id_comentario_pai: number | null
  autor: PostAutor
  total_curtidas: number
  curtiu: boolean
  respostas: Comentario[]
}

export type ComentarioOrdem = 'relevantes' | 'recentes'

export type FeedOrdem = 'recentes' | 'antigos'

export interface FeedParams {
  pagina: number
  limite: number
  ordem: FeedOrdem
  busca?: string
}

export interface FeedResult {
  posts: Post[]
  total: number
  pagina: number
  limite: number
}
