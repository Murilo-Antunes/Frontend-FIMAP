// src/features/metas/services/categorias.service.ts
import { http } from '@/lib/api/http'
import { toApiError } from '@/lib/api/types/api-error'
import type { CategoriaMeta, CriarCategoriaPayload } from '../types/metas.types'

const BASE = '/v1/openfinance/metas/categorias'

export const categoriasService = {
  /** Retorna as categorias padrão do sistema (id_usuario = null) + as personalizadas do usuário. */
  async listar(idUsuario: number): Promise<CategoriaMeta[]> {
    try {
      const { data } = await http.get<{ sucesso: boolean; categorias: CategoriaMeta[] }>(
        `${BASE}/${idUsuario}`,
      )
      return data.categorias
    } catch (error) {
      throw toApiError(error)
    }
  },

  /**
   * ⚠️ Rota nova, recomendada no chat (ainda não existe nas rotas enviadas):
   * POST /v1/openfinance/metas/categorias/:id_usuario → cria categoria personalizada vinculada ao usuário.
   */
  async criar(idUsuario: number, payload: CriarCategoriaPayload): Promise<number> {
    try {
      const { data } = await http.post<{ sucesso: boolean; id: number }>(
        `${BASE}/${idUsuario}`,
        payload,
      )
      return data.id
    } catch (error) {
      throw toApiError(error)
    }
  },
}
