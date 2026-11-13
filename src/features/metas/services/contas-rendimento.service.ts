// src/features/metas/services/contas-rendimento.service.ts
import { http } from '@/lib/api/http'
import { toApiError } from '@/lib/api/types/api-error'
import type { ContaRendimento } from '../types/metas.types'

/**
 * ⚠️ Endpoint ainda não existe no backend — ver observações no chat ("onde aplicar o dinheiro").
 * Espera-se que, para cada conexão Open Finance do usuário, o backend já resolva o CDI
 * (ou devolva `percentualCdi: null` quando não conseguir identificar).
 */
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
}
