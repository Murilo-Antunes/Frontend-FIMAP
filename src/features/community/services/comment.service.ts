import { http } from '@/lib/api/http'
import type { Comentario, CurtidaResult, PostAutor } from '../types/community.types'
import { communityEndpoints } from './community.endpoints'

export interface CreateCommentInput {
  idUsuario: number
  idPost: number
  mensagem: string
  idComentarioPai?: number | null
}

interface ComentarioApi extends Partial<Comentario> {
  id: number
  mensagem: string
  data_criacao: string
  id_usuario: number
  id_post: number
}

const AUTOR_VAZIO = (id: number): PostAutor => ({
  id,
  nome_exibicao: null,
  username_social: null,
  foto_perfil: null,
})

/** Normaliza o comentário da API (campos PROPOSTOS podem faltar) e, recursivamente, as respostas. */
function mapComentario(raw: ComentarioApi): Comentario {
  return {
    id: raw.id,
    mensagem: raw.mensagem,
    data_criacao: raw.data_criacao,
    id_usuario: raw.id_usuario,
    id_post: raw.id_post,
    id_comentario_pai: raw.id_comentario_pai ?? null,
    autor: raw.autor ?? AUTOR_VAZIO(raw.id_usuario),
    total_curtidas: Number(raw.total_curtidas ?? 0),
    curtiu: Boolean(raw.curtiu),
    respostas: (raw.respostas ?? []).map((r) => mapComentario(r as ComentarioApi)),
  }
}

export const commentService = {
  /**
   * GET /buscar-comentarios/post/:id_post?id_usuario= — existente (árvore com `respostas`).
   * PROPOSTO: `autor`, `total_curtidas` e `curtiu` em cada comentário.
   */
  async listByPost(idPost: number, idUsuario: number, signal?: AbortSignal): Promise<Comentario[]> {
    const { data } = await http.get<{ sucesso: boolean; comentarios: ComentarioApi[] }>(
      communityEndpoints.commentsByPost(idPost),
      { params: { id_usuario: idUsuario }, signal },
    )
    return (data.comentarios ?? []).map(mapComentario)
  },

  /** POST /comentar — existente. Sem `idComentarioPai` cria comentário raiz. */
  async create(input: CreateCommentInput): Promise<Comentario> {
    const { data } = await http.post<{ sucesso: boolean; comentario: ComentarioApi }>(
      communityEndpoints.createComment,
      {
        id_usuario: input.idUsuario,
        id_post: input.idPost,
        mensagem: input.mensagem,
        id_comentario_pai: input.idComentarioPai ?? null,
      },
    )
    return mapComentario(data.comentario)
  },

  /** POST /alternar-curtida-comentario — existente. Body: { id_usuario, id_comentario }. */
  async toggleLike(idComentario: number, idUsuario: number): Promise<CurtidaResult> {
    const { data } = await http.post<{ sucesso: boolean } & CurtidaResult>(
      communityEndpoints.toggleCommentLike,
      { id_usuario: idUsuario, id_comentario: idComentario },
    )
    return { curtiu: data.curtiu, total_curtidas: data.total_curtidas }
  },
}
