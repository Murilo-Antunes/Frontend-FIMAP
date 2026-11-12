import type { DashboardOverview } from '../types/dashboard.types'
import type { ResumoFinanceiroApi, EvolucaoItemApi } from '../types/openfinance.types'
import { buildOverview } from './dashboard.mapper'

export function aggregateOverviews(apis: ResumoFinanceiroApi[]): DashboardOverview {
  // Consolidar dados de evolução
  const evolutionMap = new Map<string, { receitas: number; despesas: number }>()
  for (const api of apis) {
    if (!api.evolucao?.dados) continue
    for (const item of api.evolucao.dados) {
      const key = item.mes ?? item.periodo ?? 'unknown'
      const existing = evolutionMap.get(key) || { receitas: 0, despesas: 0 }
      evolutionMap.set(key, {
        receitas: existing.receitas + (item.receitas ?? 0),
        despesas: existing.despesas + (item.despesas ?? 0),
      })
    }
  }

  const consolidatedDados: EvolucaoItemApi[] = Array.from(evolutionMap.entries()).map(([key, data]) => ({
    [key.includes('-') ? 'mes' : 'periodo']: key,
    receitas: data.receitas,
    despesas: data.despesas,
  }))

  // Inicializa a estrutura consolidada
  const consolidated: ResumoFinanceiroApi = {
    atualizando: apis.some((a) => a.atualizando),
    patrimonio: {
      saldoContas: apis.reduce((sum, a) => sum + (a.patrimonio?.saldoContas ?? 0), 0),
      totalInvestido: apis.reduce((sum, a) => sum + (a.patrimonio?.totalInvestido ?? 0), 0),
      saldoDevedor: apis.reduce((sum, a) => sum + (a.patrimonio?.saldoDevedor ?? 0), 0),
      faturaAberta: apis.reduce((sum, a) => sum + (a.patrimonio?.faturaAberta ?? 0), 0),
      patrimonioLiquido: apis.reduce((sum, a) => sum + (a.patrimonio?.patrimonioLiquido ?? 0), 0),
    },
    receitas: {
      mesAtual: apis.reduce((sum, a) => sum + (a.receitas?.mesAtual ?? 0), 0),
      mesAnterior: apis.reduce((sum, a) => sum + (a.receitas?.mesAnterior ?? 0), 0),
      variacaoPercentual: null,
    },
    despesas: {
      mesAtual: apis.reduce((sum, a) => sum + (a.despesas?.mesAtual ?? 0), 0),
      mesAnterior: apis.reduce((sum, a) => sum + (a.despesas?.mesAnterior ?? 0), 0),
      variacaoPercentual: null,
    },
    cartoes: {
      quantidade: apis.reduce((sum, a) => sum + (a.cartoes?.quantidade ?? 0), 0),
      limiteTotal: apis.reduce((sum, a) => sum + (a.cartoes?.limiteTotal ?? 0), 0),
      limiteDisponivel: apis.reduce((sum, a) => sum + (a.cartoes?.limiteDisponivel ?? 0), 0),
      faturaAberta: apis.reduce((sum, a) => sum + (a.cartoes?.faturaAberta ?? 0), 0),
      percentualDisponivel: null,
    },
    investimentos: {
      quantidade: apis.reduce((sum, a) => sum + (a.investimentos?.quantidade ?? 0), 0),
      valorAtual: apis.reduce((sum, a) => sum + (a.investimentos?.valorAtual ?? 0), 0),
      porCategoria: {},
      rentabilidadeAnualPercentual: null,
    },
    emprestimos: {
      quantidade: apis.reduce((sum, a) => sum + (a.emprestimos?.quantidade ?? 0), 0),
      saldoDevedor: apis.reduce((sum, a) => sum + (a.emprestimos?.saldoDevedor ?? 0), 0),
      parcelasMensais: apis.reduce((sum, a) => sum + (a.emprestimos?.parcelasMensais ?? 0), 0),
    },
    evolucao: { periodo: 'mes', dados: consolidatedDados },
    nucleoFinanceiro: { quantidadeContas: 0, instituicoes: [] },
    resumo: {
      quantidadeContas: apis.reduce((sum, a) => sum + (a.resumo?.quantidadeContas ?? 0), 0),
      quantidadeCartoes: apis.reduce((sum, a) => sum + (a.resumo?.quantidadeCartoes ?? 0), 0),
      quantidadeInvestimentos: apis.reduce((sum, a) => sum + (a.resumo?.quantidadeInvestimentos ?? 0), 0),
      quantidadeEmprestimos: apis.reduce((sum, a) => sum + (a.resumo?.quantidadeEmprestimos ?? 0), 0),
    },
    ultimasTransacoes: apis
      .flatMap((a) => a.ultimasTransacoes ?? [])
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5),
  }

  return buildOverview(consolidated)
}
