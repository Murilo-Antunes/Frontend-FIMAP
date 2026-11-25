/**
 * Caminhos da API da comunidade, num só lugar (espelham o app.js):
 *   /v1/comunidade/posts              -> postRoutes
 *   /v1/comunidade/posts/comentario   -> comentarRoutes
 *   /v1/comunidade/curtida            -> curtirRoutes
 */
const POSTS = '/v1/comunidade/posts'
const COMENTARIOS = `${POSTS}/comentario`
const CURTIDAS = '/v1/comunidade/curtida'
const DENUNCIA_POST = '/v1/comunidade/denuncia'
const DENUNCIA_USUARIO = '/v1/comunidade/denuncias'

export const communityEndpoints = {
  /** PROPOSTO: ainda não existe em postRoutes (ver guia, seção 3.1). */
  feed: `${POSTS}/feed`,
  createPost: `${POSTS}/criar`,
  postById: (idPost: number) => `${POSTS}/buscar/${idPost}`,
  savePost: `${POSTS}/salvar`,
  savedPosts: (idUsuario: number) => `${POSTS}/salvos/${idUsuario}`,

  togglePostLike: `${CURTIDAS}/alternar-curtida-post`,
  toggleCommentLike: `${CURTIDAS}/alternar-curtida-comentario`,

  /** Denúncias: post e perfil usam rotas (e corpos) diferentes no backend. */
  reportCategories: `${DENUNCIA_POST}/categorias`,
  reportPost: `${DENUNCIA_POST}/criar`,
  reportUser: `${DENUNCIA_USUARIO}/denunciar-usuario`,

  createComment: `${COMENTARIOS}/comentar`,
  commentsByPost: (idPost: number) => `${COMENTARIOS}/buscar-comentarios/post/${idPost}`,
} as const
