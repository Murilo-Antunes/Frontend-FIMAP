/**
 * Caminhos da API da comunidade, num só lugar.
 * Ajuste aqui caso o prefixo montado no app.js seja diferente.
 */
const COMUNIDADE = '/v1/comunidade'

export const communityEndpoints = {
  feed: `${COMUNIDADE}/posts/feed`,
  postById: (idPost: number) => `${COMUNIDADE}/posts/buscar/${idPost}`,

  togglePostLike: `${COMUNIDADE}/curtidas-post/alternar-curtida-post`,
  toggleCommentLike: `${COMUNIDADE}/curtidas-comentario/alternar-curtida-comentario`,

  createComment: `${COMUNIDADE}/comentarios/comentar`,
  commentsByPost: (idPost: number) => `${COMUNIDADE}/comentarios/buscar-comentarios/post/${idPost}`,
} as const
