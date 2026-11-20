/**
 * Tipos da parte social (perfil + badges).
 *
 * ⚠️ Pontos a confirmar/ajustar com o backend (ver resumo no chat):
 * 1) Não existe coluna de data de cadastro em tbl_usuario — "data_entrada" abaixo
 *    é um placeholder até isso existir.
 * 2) tbl_badge não tem coluna "categoria" — o campo abaixo é opcional e, por ora,
 *    sempre vai vir undefined.
 * 3) Não há rota para "badges em progresso" (não conquistadas) — o tipo existe
 *    para já deixar a UI pronta, mas hoje nada preenche essa lista.
 * 4) Não há GET dedicado para badges em destaque — presumimos que
 *    GET /badge-usuario/:id_usuario já devolve "em_destaque" em cada badge.
 *    Se não devolver, me avise.
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
  xp_usuario: number
  nivel_total: number
  ranking_posicao: number
  total_seguidores: number
  total_seguindo: number
  total_badges: number
  /** ⚠️ Não existe na tbl_usuario hoje — confirmar origem (plano PRO/FREE). */
  plano?: 'FREE' | 'PRO'
  /** ⚠️ Não existe na tbl_usuario hoje — necessário para "Membro desde ...". */
  data_entrada?: string
}

export interface Badge {
  id: number
  icone: string
  nome: string
  descricao: string
  xp: number
  /** ⚠️ Coluna ainda não existe em tbl_badge. */
  categoria?: string
}

export interface BadgeUsuario extends Badge {
  data_conquista: string
  /** ⚠️ Confirmar se BuscarBadgesUsuario retorna este campo. */
  em_destaque?: boolean
}

/** Badge ainda não conquistada, com progresso. Hoje sem suporte no backend. */
export interface BadgeEmProgresso extends Badge {
  conquistada: false
  progresso_atual: number
  progresso_total: number
}

export type AbaPerfil = 'publicacoes' | 'respostas' | 'salvos' | 'arquivados'
