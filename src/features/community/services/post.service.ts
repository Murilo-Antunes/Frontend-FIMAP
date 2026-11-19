import { http } from '@/lib/api/http'
import type { CurtidaResult, FeedParams, FeedResult, Post } from '../types/community.types'
import { communityEndpoints } from './community.endpoints'

interface FeedApi {
  sucesso: boolean
  pagina: number
  limite: number
  total: number
  quantidade: number
  posts: Post[]
}

export const postService = {
  /**
   * PROPOSTO: GET /posts/feed?pagina=&limite=&ordem=recentes|antigos&busca=&id_usuario=
   * Posts ativos de todos os usuários, com `autor`, `total_curtidas`, `total_comentarios`
   * e `curtiu` (do usuário informado) embutidos.
   */
  async listFeed(params: FeedParams, idUsuario: number, signal?: AbortSignal): Promise<FeedResult> {
    const { data } = await http.get<FeedApi>(communityEndpoints.feed, {
      params: {
        pagina: params.pagina,
        limite: params.limite,
        ordem: params.ordem,
        busca: params.busca?.trim() || undefined,
        id_usuario: idUsuario,
      },
      signal,
    })

    return { posts: data.posts, total: data.total, pagina: data.pagina, limite: data.limite }
  },

  /** GET /buscar/:id_post?id_usuario= — existente; autor/contagens/curtiu são PROPOSTOS. */
  async getPost(idPost: number, idUsuario: number, signal?: AbortSignal): Promise<Post> {
    const { data } = await http.get<{ sucesso: boolean; post: Post }>(
      communityEndpoints.postById(idPost),
      { params: { id_usuario: idUsuario }, signal },
    )
    return data.post
  },

  /** POST /alternar-curtida-post — existente. Body: { id_usuario, id_post }. */
  async toggleLike(idPost: number, idUsuario: number): Promise<CurtidaResult> {
    const { data } = await http.post<{ sucesso: boolean } & CurtidaResult>(
      communityEndpoints.togglePostLike,
      { id_usuario: idUsuario, id_post: idPost },
    )
    return { curtiu: data.curtiu, total_curtidas: data.total_curtidas }
  },
}
