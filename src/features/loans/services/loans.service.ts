import { http } from '@/lib/api/http'
import type { LoanDetailApiResponse, LoansApiResponse } from '../types/loans.types'

export const loansService = {
  async listLoans(itemId: string, signal?: AbortSignal) {
    const { data } = await http.get<LoansApiResponse>(`/v1/openfinance/financeiro/emprestimos/${itemId}`, {
      signal,
    })
    return data
  },

  async listAllLoans(itemIds: string[], signal?: AbortSignal) {
    const responses = await Promise.all(
      itemIds.map(async (itemId) => {
        const response = await this.listLoans(itemId, signal)
        return {
          itemId,
          ...response,
        }
      }),
    )

    return {
      atualizando: responses.some((res) => res.atualizando),
      total: responses.reduce((sum, res) => sum + res.total, 0),
      emprestimos: responses.flatMap((res) => res.emprestimos.map((e) => ({ ...e, itemId: res.itemId }))),
    }
  },

  /**
   * Única chamada para a tela de Histórico (e para a pré-visualização da tela de
   * Empréstimos): traz o resumo do empréstimo + pendentes + pagas (paginadas) +
   * amortizadas de uma vez só. `limitePagas` controla quantas parcelas pagas
   * detalhadas voltam — o resto vem resumido em `pagas.resumoRestante`.
   */
  async getLoanDetail(itemId: string, loanId: string, limitePagas = 10, signal?: AbortSignal) {
    const { data } = await http.get<LoanDetailApiResponse>(
      `/v1/openfinance/financeiro/emprestimos/${itemId}/${loanId}/detalhe`,
      { params: { limitePagas }, signal },
    )
    return data
  },

  async getLoanDetailAcrossAll(itemIds: string[], loanId: string, limitePagas = 10, signal?: AbortSignal) {
    for (const itemId of itemIds) {
      try {
        return await this.getLoanDetail(itemId, loanId, limitePagas, signal)
      } catch (e) {
        // Tenta na próxima conexão
      }
    }
    throw new Error('Empréstimo não encontrado.')
  },
}