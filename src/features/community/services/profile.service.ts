/**
 * ⚠️ Mesmo aviso de antes: troque o import abaixo pelo client HTTP real do
 * projeto, e confira as 5 constantes BASE_* contra o prefixo real de
 * montagem de cada router no seu app.js/server.js.
 */
import { http } from '@/lib/api/http' // TODO: ajustar para o client real do projeto
import type { Badge, BadgeEmProgresso, BadgeUsuario, NivelInfo, PerfilUsuario } from '../types/profile.types'
import type { Post } from '@/features/community/types/community.types'

const BASE_USUARIO = '/v1/openfinance/usuario'
const BASE_BADGES = '/v1/comunidade/badge'
const BASE_POSTS = '/v1/comunidade/posts'
const BASE_COMENTARIOS = '/v1/comunidade/comentarios'
const BASE_SEGUIR = '/v1/comunidade/seguir'
const BASE_COMUNIDADE = '/v1/comunidade' // onde você montou nivelRoutes

/* ----------------------------- Perfil ----------------------------- */

export async function buscarPerfilPorId(idUsuario: number): Promise<PerfilUsuario> {
  const { data } = await http.get(`${BASE_USUARIO}/usuario/id/${idUsuario}`)
  return data.usuario ?? data
}

export async function buscarPerfilPorUsername(usernameSocial: string): Promise<PerfilUsuario> {
  const { data } = await http.get(`${BASE_USUARIO}/social/username-disponivel/${usernameSocial}`)
  return data.usuario ?? data
}

/* ----------------------------- Badges ----------------------------- */

export async function buscarTodasBadges(): Promise<Badge[]> {
  const { data } = await http.get(`${BASE_BADGES}/badges`)
  return data.badges ?? data
}

export async function buscarBadgesUsuario(idUsuario: number): Promise<BadgeUsuario[]> {
  const { data } = await http.get(`${BASE_BADGES}/badge-usuario/${idUsuario}`)
  return data.badges ?? data
}

export async function definirBadgesDestaque(idUsuario: number, idsBadge: number[]) {
  const { data } = await http.patch(`${BASE_BADGES}/badge-usuario/destaques/${idUsuario}`, {
    ids_badge: idsBadge,
  })
  return data
}

/** NOVO — ids das badges marcadas como destaque pelo usuário. */
export async function buscarIdsBadgesDestaque(idUsuario: number): Promise<number[]> {
  const { data } = await http.get(`${BASE_BADGES}/badge-usuario/destaques/${idUsuario}`)
  return data.ids_badge ?? []
}

/** NOVO — badges bloqueadas com progresso calculado (as que têm criterio_tipo). */
export async function buscarProgressoBadges(idUsuario: number): Promise<BadgeEmProgresso[]> {
  const { data } = await http.get(`${BASE_BADGES}/badge-usuario/progresso/${idUsuario}`)
  return data.badges ?? []
}

/* ------------------------- Posts / Respostas / Salvos ------------------------- */

export async function listarPostsPorUsuario(idUsuario: number): Promise<Post[]> {
  const { data } = await http.get(`${BASE_POSTS}/buscar/post/${idUsuario}`)
  return data.posts ?? data
}

export async function listarPostsInativos(idUsuario: number): Promise<Post[]> {
  const { data } = await http.get(`${BASE_POSTS}/inativos/${idUsuario}`)
  return data.posts ?? data
}

export async function listarComentariosPorUsuario(idUsuario: number) {
  const { data } = await http.get(`${BASE_COMENTARIOS}/buscar-comentario/usuario/${idUsuario}`)
  return { quantidade: data.quantidade ?? 0, comentarios: data.comentarios ?? [] }
}

/**
 * NOVO — aba "Salvos" com dados reais.
 * ⚠️ A query de postSalvoDAO.js devolve linhas "cruas" (id_post, autor_nome,
 * total_curtidas...), num formato diferente do `Post` que o PostCard espera
 * (autor aninhado, campo `curtiu`). Mapeamos aqui pra não ter que duplicar
 * o PostCard só pra essa aba. `curtiu` fica sempre `false` porque a query
 * não verifica curtida do usuário logado — se quiser esse dado certo,
 * adicione um JOIN com tbl_curtida_post no backend igual ao que a
 * vw_feed_comunidade/postController já fazem no feed normal.
 */
export async function listarPostsSalvos(idUsuario: number): Promise<Post[]> {
  const { data } = await http.get(`${BASE_POSTS}/salvos/${idUsuario}`)
  const linhas = data.posts ?? []

  return linhas.map((linha: any) => ({
    id: linha.id_post,
    conteudo: linha.conteudo,
    data_criacao: linha.data_criacao,
    data_atualizacao: linha.data_atualizacao ?? null,
    autor: {
      id: linha.id_autor,
      nome_exibicao: linha.autor_nome,
      username_social: linha.username_social,
      foto_perfil: linha.foto_perfil,
      nivel_total: linha.nivel_total,
    },
    total_curtidas: Number(linha.total_curtidas ?? 0),
    total_comentarios: Number(linha.total_comentarios ?? 0),
    curtiu: false, // ⚠️ ver aviso acima
  }))
}

export async function alternarSalvarPost(idUsuario: number, idPost: number) {
  const { data } = await http.post(`${BASE_POSTS}/salvar/alternar`, { id_usuario: idUsuario, id_post: idPost })
  return data as { salvo: boolean }
}

/* --------------------------- Seguir / Unfollow --------------------------- */

export async function seguir(idSeguidor: number, idSeguindo: number) {
  const { data } = await http.post(`${BASE_SEGUIR}/seguir`, {
    id_seguidor: idSeguidor,
    id_seguindo: idSeguindo,
  })
  return data
}

export async function deixarDeSeguir(idSeguidor: number, idSeguindo: number) {
  const { data } = await http.delete(`${BASE_SEGUIR}/unfollow`, {
    data: { id_seguidor: idSeguidor, id_seguindo: idSeguindo },
  })
  return data
}

export async function listarSeguidores(idUsuario: number) {
  const { data } = await http.get(`${BASE_SEGUIR}/listar/seguidores/${idUsuario}`)
  return data.seguidores ?? data
}

export async function listarSeguindo(idUsuario: number) {
  const { data } = await http.get(`${BASE_SEGUIR}/listar/seguindo/${idUsuario}`)
  return data.seguindo ?? data
}

/** ATUALIZADO — agora usa o endpoint dedicado em vez de baixar a lista inteira. */
export async function jaSegue(idSeguidor: number, idSeguindo: number): Promise<boolean> {
  const { data } = await http.get(`${BASE_SEGUIR}/verificar`, {
    params: { id_seguidor: idSeguidor, id_seguindo: idSeguindo },
  })
  return Boolean(data.segue)
}

/* ------------------------------- Níveis ------------------------------- */

/** NOVO — títulos de nível agora vêm do backend (tbl_nivel). */
export async function buscarNiveis(): Promise<NivelInfo[]> {
  const { data } = await http.get(`${BASE_COMUNIDADE}/niveis`)
  return data.niveis ?? []
}
