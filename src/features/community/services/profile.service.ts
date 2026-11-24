/**
 * ⚠️ Mesmo aviso de antes: troque o import abaixo pelo client HTTP real do
 * projeto, e confira as 5 constantes BASE_* contra o prefixo real de
 * montagem de cada router no seu app.js/server.js.
 */
import { http } from '@/lib/api/http' // TODO: ajustar para o client real do projeto
import type {
  Badge,
  BadgeEmProgresso,
  BadgeUsuario,
  ConfiguracoesSociais,
  EstadoSolicitacao,
  NivelInfo,
  PerfilUsuario,
  QuemPodeComentar,
  ResumoSocial,
  SolicitacaoRecebida,
  TipoSolicitacao,
  UsuarioBloqueado,
} from '../types/profile.types'
import type { Post } from '@/features/community/types/community.types'

const BASE_USUARIO = '/v1/openfinance/usuario'
const BASE_BADGES = '/v1/comunidade/badge'
const BASE_POSTS = '/v1/comunidade/posts'
const BASE_COMENTARIOS = '/v1/comunidade/posts/comentario'
const BASE_SEGUIR = '/v1/comunidade/seguir'
const BASE_COMUNIDADE = '/v1/comunidade' // onde você montou nivelRoutes
const BASE_SOCIAL = '/v1/comunidade/social'

// Identidade: o interceptor do `http` já manda o Bearer token e o backend lê o
// usuário do token. Nenhuma chamada daqui envia "quem sou eu" por query/body de
// verificação — os ids que vão no corpo (id_seguidor, id_solicitante...) são
// conferidos contra o token no backend.

/* ----------------------------- Perfil ----------------------------- */

export async function buscarPerfilPorId(idUsuario: number): Promise<PerfilUsuario> {
  const { data } = await http.get(`${BASE_USUARIO}/usuario/id/${idUsuario}`)
  return data.usuario ?? data
}

/** Perfil privado volta só com o resumo + `acesso_restrito: true` (o backend decide pelo token). */
export async function buscarPerfilPorUsername(usernameSocial: string): Promise<PerfilUsuario> {
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

/* ------------------- Configurações do espaço social ------------------- */

const OPCOES_COMENTARIO: QuemPodeComentar[] = ['todos', 'seguidores', 'ninguem']
// MySQL devolve TINYINT como 0/1 — normaliza pra boolean.
const paraBool = (valor: unknown, padrao: boolean) =>
  valor === undefined || valor === null ? padrao : Boolean(Number(valor))

/** GET /v1/comunidade/social/configuracoes/:id_usuario */
export async function buscarConfiguracoesSociais(idUsuario: number): Promise<ConfiguracoesSociais> {
  const { data } = await http.get(`${BASE_SOCIAL}/configuracoes/${idUsuario}`)
  const c = data.configuracoes ?? data
  return {
    visibilidade: paraBool(c?.visibilidade, true),
    quem_comenta: OPCOES_COMENTARIO.includes(c?.quem_comenta) ? c.quem_comenta : 'todos',
    notif_respostas_mencoes: paraBool(c?.notif_respostas_mencoes, true),
    notif_topicos_ia: paraBool(c?.notif_topicos_ia, true),
    notif_conquistas: paraBool(c?.notif_conquistas, true),
  }
}

/** PATCH /v1/comunidade/social/configuracoes/:id_usuario (aceita campos parciais) */
export async function atualizarConfiguracoesSociais(
  idUsuario: number,
  parcial: Partial<ConfiguracoesSociais>,
) {
  const { data } = await http.patch(`${BASE_SOCIAL}/configuracoes/${idUsuario}`, parcial)
  return data
}

/** GET /v1/comunidade/social/resumo/:id_usuario */
export async function buscarResumoSocial(idUsuario: number): Promise<ResumoSocial> {
  const { data } = await http.get(`${BASE_SOCIAL}/resumo/${idUsuario}`)
  const r = data.resumo ?? data
  const numeroOuNull = (v: unknown) => (v === undefined || v === null || Number.isNaN(Number(v)) ? null : Number(v))
  return {
    audiencia_visivel: numeroOuNull(r?.audiencia_visivel),
    xp_semana: numeroOuNull(r?.xp_semana),
    percentil_ranking: numeroOuNull(r?.percentil_ranking),
    solicitacoes_pendentes: numeroOuNull(r?.solicitacoes_pendentes) ?? 0,
  }
}

/** PATCH /v1/comunidade/social/desativar/:id_usuario */
export async function desativarPerfilSocial(idUsuario: number) {
  const { data } = await http.patch(`${BASE_SOCIAL}/desativar/${idUsuario}`)
  return data
}

/* ------------------ Solicitação de acesso (perfil privado) ------------------ */

/** GET /v1/comunidade/seguir/solicitacao/status */
export async function buscarEstadoSolicitacao(
  idSolicitante: number,
  idDestinatario: number,
): Promise<EstadoSolicitacao> {
  const { data } = await http.get(`${BASE_SEGUIR}/solicitacao/status`, {
    params: { id_solicitante: idSolicitante, id_destinatario: idDestinatario },
  })
  return data.status === 'pendente' ? 'pendente' : 'nenhuma'
}

/** POST /v1/comunidade/seguir/solicitar */
export async function solicitarAcesso(
  idSolicitante: number,
  idDestinatario: number,
  tipo: TipoSolicitacao,
) {
  const { data } = await http.post(`${BASE_SEGUIR}/solicitar`, {
    id_solicitante: idSolicitante,
    id_destinatario: idDestinatario,
    tipo,
  })
  return data
}

/** DELETE /v1/comunidade/seguir/solicitar */
export async function cancelarSolicitacao(idSolicitante: number, idDestinatario: number) {
  const { data } = await http.delete(`${BASE_SEGUIR}/solicitar`, {
    data: { id_solicitante: idSolicitante, id_destinatario: idDestinatario },
  })
  return data
}

/** GET /v1/comunidade/seguir/solicitacoes/recebidas/:id_usuario */
export async function listarSolicitacoesRecebidas(idUsuario: number): Promise<SolicitacaoRecebida[]> {
  const { data } = await http.get(`${BASE_SEGUIR}/solicitacoes/recebidas/${idUsuario}`)
  return data.solicitacoes ?? []
}

/** PATCH /v1/comunidade/seguir/solicitacoes/:id/responder */
export async function responderSolicitacao(
  idUsuario: number,
  idSolicitacao: number,
  decisao: 'aceitar' | 'recusar',
) {
  const { data } = await http.patch(`${BASE_SEGUIR}/solicitacoes/${idSolicitacao}/responder`, {
    id_usuario: idUsuario,
    decisao,
  })
  return data
}

/* ------------------------------- Bloqueios ------------------------------- */

/** GET /v1/comunidade/social/bloqueios/:id_usuario */
export async function listarBloqueados(idUsuario: number): Promise<UsuarioBloqueado[]> {
  const { data } = await http.get(`${BASE_SOCIAL}/bloqueios/${idUsuario}`)
  return data.bloqueados ?? []
}

/** POST /v1/comunidade/social/bloqueios */
export async function bloquearUsuario(idUsuario: number, idBloqueado: number) {
  const { data } = await http.post(`${BASE_SOCIAL}/bloqueios`, {
    id_usuario: idUsuario,
    id_bloqueado: idBloqueado,
  })
  return data
}

/** DELETE /v1/comunidade/social/bloqueios/:id_usuario/:id_bloqueado */
export async function desbloquearUsuario(idUsuario: number, idBloqueado: number) {
  const { data } = await http.delete(`${BASE_SOCIAL}/bloqueios/${idUsuario}/${idBloqueado}`)
  return data
}
