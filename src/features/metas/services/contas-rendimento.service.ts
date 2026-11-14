// src/features/metas/services/contas-rendimento.service.ts
import { http } from '@/lib/api/http'
import { toApiError } from '@/lib/api/types/api-error'
import type { ContaRendimento } from '../types/metas.types'

const BASE = '/v1/openfinance/contas-rendimento'

export const contasRendimentoService = {
  async listar(clientUserId: number): Promise<ContaRendimento[]> {
    try {
      const { data } = await http.get<{ sucesso: boolean; contas: ContaRendimento[] }>(BASE, {
        params: { clientUserId },
      })
      return data.contas
    } catch (error) {
      throw toApiError(error)
    }
  },

  /** percentualCdi em fração (ex.: 1 = 100% do CDI), não em "100". */
  async atualizarCdiManual(clientUserId: number, idConexao: number, percentualCdi: number): Promise<void> {
    try {
      await http.put(`${BASE}/${idConexao}`, { clientUserId, percentualCdi })
    } catch (error) {
      throw toApiError(error)
    }
  },
}
