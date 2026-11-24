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
  /** POST /salvar/alternar. A identidade do usuário vem do token JWT. */
  async toggleSaved(idPost: number): Promise<boolean> {
    const { data } = await http.post<{ conteudo?: { salvo?: boolean }; salvo?: boolean }>(
      `${communityEndpoints.savePost}/alternar`,
      { id_post: idPost },
    )
    return Boolean(data.conteudo?.salvo ?? data.salvo)
  },

  /** GET /salvar/verificar/:id_post. */
  async isSaved(idPost: number): Promise<boolean> {
    const { data } = await http.get<{ conteudo?: { salvo?: boolean }; salvo?: boolean }>(
      `${communityEndpoints.savePost}/verificar/${idPost}`,
    )
    return Boolean(data.conteudo?.salvo ?? data.salvo)
  },

  /** GET /salvos/:id_usuario?pagina=&limite= */
  async listSaved(idUsuario: number, pagina = 1, limite = 12, signal?: AbortSignal): Promise<FeedResult> {
    const { data } = await http.get<FeedApi>(communityEndpoints.savedPosts(idUsuario), {
      params: { pagina, limite },
      signal,
    })
    return { posts: data.posts ?? [], total: data.total ?? 0, pagina: data.pagina ?? pagina, limite: data.limite ?? limite }
  },

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

  /**
   * POST /criar. Os nomes dos campos multipart seguem o contrato do backend.
   */
  async create(texto: string, midias: File[] = []): Promise<Post> {
    const body = new FormData()
    if (texto) body.append('conteudo[texto]', texto)
    midias.forEach((arquivo) => {
      body.append(arquivo.type === 'video/mp4' ? 'conteudo[midia]' : 'conteudo[foto]', arquivo)
    })

    const { data } = await http.post<{ sucesso: boolean; mensagem: string; post: Partial<Post> & Pick<Post, 'id'> }>(
      communityEndpoints.createPost,
      body,
    )
    return data.post as Post
  },
}
