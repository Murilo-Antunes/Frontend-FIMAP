// src/features/dashboard/services/finance.service.ts

import { http } from '@/lib/api/http';
import type {
  SaldoNucleoData,
  CartoesData,
  ContasConectadasData,
  InvestimentosData,
  EmprestimosData,
  TransacoesResponseData,
  TransacoesFiltro,
  ApiResponse
} from '../types/finance.types';

export const financeService = {
  async getSaldoNucleo(itemId: string, signal?: AbortSignal): Promise<SaldoNucleoData> {
    const { data } = await http.get<SaldoNucleoData>(`/v1/openfinance/financeiro/saldo/${itemId}`, { signal });
    return data;
  },

  async getCartoes(itemId: string, signal?: AbortSignal): Promise<CartoesData> {
    const { data } = await http.get<CartoesData>(`/v1/openfinance/financeiro/cartoes/${itemId}`, { signal });
    return data;
  },

  async getContas(itemId: string, signal?: AbortSignal): Promise<ContasConectadasData> {
    const { data } = await http.get<ContasConectadasData>(`/v1/openfinance/financeiro/contas/${itemId}`, { signal });
    return data;
  },

  async getInvestimentos(itemId: string, signal?: AbortSignal): Promise<InvestimentosData> {
    const { data } = await http.get<InvestimentosData>(`/v1/openfinance/financeiro/investimentos/${itemId}`, { signal });
    return data;
  },

  async getEmprestimos(itemId: string, signal?: AbortSignal): Promise<EmprestimosData> {
    const { data } = await http.get<EmprestimosData>(`/v1/openfinance/financeiro/emprestimos/${itemId}`, { signal });
    return data;
  },

    async getTransacoes(
    itemId: string,
    filtros?: TransacoesFiltro,
    signal?: AbortSignal
  ): Promise<TransacoesResponseData> {
    const { data } = await http.get<ApiResponse<TransacoesResponseData> | TransacoesResponseData>(
      `/v1/openfinance/financeiro/transacoes/${itemId}`,
      {
        params: filtros,
        signal
      }
    );
    return 'dados' in data && data.dados ? data.dados : (data as TransacoesResponseData);
  }
};