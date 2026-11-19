import { http } from '@/lib/api/http'
import type { Badge, PerfilSocial, PerfilSocialPayload } from '../types/community.types'

const USUARIO = '/v1/openfinance/usuario'
const BADGE = '/v1/badge'

/** Linha do usuário como o backend devolve (o DAO pode usar `id` ou `id_usuario`). */
interface UsuarioApi {
  id?: number
  id_usuario?: number
  nome_exibicao?: string | null
  username_social?: string | null
  biografia_social?: string | null
  localizacao_estado?: string | null
  foto_perfil?: string | null
}

function mapPerfil(raw: UsuarioApi): PerfilSocial {
  return {
    id: Number(raw.id ?? raw.id_usuario),
    nome_exibicao: raw.nome_exibicao ?? null,
    username_social: raw.username_social ?? null,
    biografia_social: raw.biografia_social ?? null,
    localizacao_estado: raw.localizacao_estado ?? null,
    foto_perfil: raw.foto_perfil ?? null,
  }
}

export const socialProfileService = {
  /** GET /usuario/id/:id_usuario — existente. */
  async getProfile(idUsuario: number, signal?: AbortSignal): Promise<PerfilSocial> {
    const { data } = await http.get<{ sucesso: boolean; usuario: UsuarioApi }>(
      `${USUARIO}/usuario/id/${idUsuario}`,
      { signal },
    )
    return mapPerfil(data.usuario)
  },

  /** PATCH /usuario-update/:id_usuario — existente (a API devolve só { sucesso, mensagem }). */
  async updateProfile(idUsuario: number, payload: PerfilSocialPayload): Promise<void> {
    await http.patch(`${USUARIO}/usuario-update/${idUsuario}`, payload)
  },

  /** PROPOSTO: GET /social/username-disponivel/:username_social?id_usuario= */
  async checkUsernameAvailability(
    username: string,
    idUsuario: number,
    signal?: AbortSignal,
  ): Promise<boolean> {
    const { data } = await http.get<{ sucesso: boolean; disponivel: boolean }>(
      `${USUARIO}/social/username-disponivel/${encodeURIComponent(username)}`,
      { params: { id_usuario: idUsuario }, signal },
    )
    return data.disponivel
  },

  /**
   * PROPOSTO: POST /foto-perfil/:id_usuario (multipart, campo "foto").
   * O backend envia ao Cloudinary, grava `foto_perfil`, apaga a foto anterior e devolve a URL.
   */
  async uploadPhoto(idUsuario: number, file: File): Promise<string> {
    const body = new FormData()
    body.append('foto', file)

    const { data } = await http.post<{ sucesso: boolean; foto_perfil: string }>(
      `${USUARIO}/foto-perfil/${idUsuario}`,
      body,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.foto_perfil
  },

  /** PROPOSTO: DELETE /foto-perfil/:id_usuario — apaga do Cloudinary e zera `foto_perfil`. */
  async removePhoto(idUsuario: number): Promise<void> {
    await http.delete(`${USUARIO}/foto-perfil/${idUsuario}`)
  },

  /** GET /v1/badge/badge-usuario/:id_usuario — existente (campo `destaque` é PROPOSTO). */
  async listBadges(idUsuario: number, signal?: AbortSignal): Promise<Badge[]> {
    const { data } = await http.get<{ sucesso: boolean; badges?: Badge[] }>(
      `${BADGE}/badge-usuario/${idUsuario}`,
      { signal },
    )
    return data.badges ?? []
  },

  /** PROPOSTO: PATCH /v1/badge/badge-usuario/destaques/:id_usuario  { ids_badge: number[] } (máx. 3). */
  async setFeaturedBadges(idUsuario: number, idsBadge: number[]): Promise<void> {
    await http.patch(`${BADGE}/badge-usuario/destaques/${idUsuario}`, { ids_badge: idsBadge })
  },
}
