/**
 * ⚠️ AJUSTE NECESSÁRIO: troque o import abaixo pelo client HTTP (instância do
 * axios já configurada, com baseURL) que o projeto usa nos outros services
 * (ex.: o mesmo client usado em post.service.ts). Os paths abaixo seguem
 * exatamente as rotas que você mandou; só confirme os prefixos de montagem
 * de cada router (ex.: "/v1/comunidade/badges", "/v1/comunidade/posts",
 * "/v1/comunidade/seguir", "/v1/openfinance/usuario") — ajuste as 4
 * constantes BASE_* se o prefixo real for diferente.
 */
import { http } from '@/lib/api/http' // TODO: ajustar para o client real do projeto
import type { Badge, BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import type { Post } from '@/features/community/types/community.types'

const BASE_USUARIO = '/v1/openfinance/usuario'
const BASE_BADGES = '/v1/comunidade/badges'
const BASE_POSTS = '/v1/comunidade/posts'
const BASE_COMENTARIOS = '/v1/comunidade/comentarios'
const BASE_SEGUIR = '/v1/comunidade/seguir'

/* ----------------------------- Perfil ----------------------------- */

export async function buscarPerfilPorId(idUsuario: number): Promise<PerfilUsuario> {
  const { data } = await http.get(`${BASE_USUARIO}/usuario/id/${idUsuario}`)
  return data.usuario ?? data
}

export async function buscarPerfilPorUsername(usernameSocial: string): Promise<PerfilUsuario> {
  // ⚠️ A rota existente é /usuario/:username — confirme se "username" aqui
  // aceita o username_social (perfil público) ou só o username de login.
  const { data } = await http.get(`${BASE_USUARIO}/usuario/${usernameSocial}`)
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

/* ------------------------- Posts / Respostas ------------------------- */

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

/**
 * ⚠️ Não existe endpoint dedicado para "o usuário X já segue o usuário Y?".
 * Por enquanto inferimos cruzando a lista de seguidores do perfil-alvo com o
 * id do usuário logado. Isso funciona, mas baixa 1 lista inteira só para
 * checar 1 relação — vale a pena um GET /seguir/verificar?id_seguidor=&id_seguindo=
 * no futuro.
 */
export async function jaSegue(idSeguidor: number, idPerfilAlvo: number): Promise<boolean> {
  const seguidores = await listarSeguidores(idPerfilAlvo)
  return seguidores.some((s: { id_seguidor: number }) => s.id_seguidor === idSeguidor)
}
