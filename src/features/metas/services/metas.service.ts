// src/features/metas/services/metas.service.ts
import { http } from '@/lib/api/http'
import { toApiError } from '@/lib/api/types/api-error'
import type { AtualizarMetaPayload, CriarMetaPayload, MetaApi, StatusMeta } from '../types/metas.types'

const BASE = '/v1/openfinance/metas'

/**
 * ⚠️ Assume o backend já ajustado conforme as observações passadas no chat:
 * respostas sempre no formato { sucesso, mensagem, ...campos } / erro { sucesso:false, codigo, mensagem, campos }.
 */
export const metasService = {
  async listar(idUsuario: number): Promise<MetaApi[]> {
    try {
      const { data } = await http.get<{ sucesso: boolean; metas: MetaApi[] }>(`${BASE}/${idUsuario}`)
      return data.metas
    } catch (error) {
      throw toApiError(error)
    }
  },

  async buscarPorId(idUsuario: number, id: number): Promise<MetaApi> {
    try {
      const { data } = await http.get<{ sucesso: boolean; meta: MetaApi }>(`${BASE}/${idUsuario}/${id}`)
      return data.meta
    } catch (error) {
      throw toApiError(error)
    }
  },

  async criar(idUsuario: number, payload: CriarMetaPayload): Promise<number> {
    try {
      const { data } = await http.post<{ sucesso: boolean; id: number }>(`${BASE}/${idUsuario}`, payload)
      return data.id
    } catch (error) {
      throw toApiError(error)
    }
  },

  async atualizar(idUsuario: number, id: number, payload: AtualizarMetaPayload): Promise<void> {
    try {
      await http.put(`${BASE}/${idUsuario}/${id}`, payload)
    } catch (error) {
      throw toApiError(error)
    }
  },

  async alterarStatus(idUsuario: number, id: number, status: StatusMeta): Promise<void> {
    return this.atualizar(idUsuario, id, { status })
  },

  async excluir(idUsuario: number, id: number): Promise<void> {
    try {
      await http.delete(`${BASE}/${idUsuario}/${id}`)
    } catch (error) {
      throw toApiError(error)
    }
  },
}
