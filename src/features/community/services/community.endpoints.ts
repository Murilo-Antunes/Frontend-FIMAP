/**
 * Caminhos da API da comunidade, num só lugar (espelham o app.js):
 *   /v1/comunidade/posts              -> postRoutes
 *   /v1/comunidade/posts/comentario   -> comentarRoutes
 *   /v1/comunidade/curtida            -> curtirRoutes
 */
const POSTS = '/v1/comunidade/posts'
const COMENTARIOS = `${POSTS}/comentario`
const CURTIDAS = '/v1/comunidade/curtida'

export const communityEndpoints = {
  /** PROPOSTO: ainda não existe em postRoutes (ver guia, seção 3.1). */
  feed: `${POSTS}/feed`,
  postById: (idPost: number) => `${POSTS}/buscar/${idPost}`,

  togglePostLike: `${CURTIDAS}/alternar-curtida-post`,
  toggleCommentLike: `${CURTIDAS}/alternar-curtida-comentario`,

  createComment: `${COMENTARIOS}/comentar`,
  commentsByPost: (idPost: number) => `${COMENTARIOS}/buscar-comentarios/post/${idPost}`,
} as const
