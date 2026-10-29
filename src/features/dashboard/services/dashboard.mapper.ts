import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { formatCurrency, formatPercent } from '@/lib/format'
import type {
  CoreItem,
  DashboardOverview,
  DashboardSummary,
  DashboardTransaction,
  EvolutionPoint,
} from '../types/dashboard.types'
import type { ResumoFinanceiroApi, TransacaoApi } from '../types/openfinance.types'

// ---- Utilitários ---------------------------------------------------------------------------

const num = (value: number | null | undefined): number => (Number.isFinite(value) ? (value as number) : 0)
const round = (value: number, digits = 1): number => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
const clampPercent = (value: number): number => Math.min(100, Math.max(0, value))
const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

// ---- Investimentos: categorias da API (inglês) -> rótulos ----------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  FIXED_INCOME: 'Renda Fixa',
  EQUITY: 'Ações',
  ETF: 'ETFs',
  MUTUAL_FUND: 'Fundos',
  SECURITY: 'Valores mobiliários',
  COE: 'COE',
  OTHER: 'Outros',
}

function categoryLabel(key: string): string {
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key]
  const text = key.toLowerCase().replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ---- Resumo (cards do topo) ----------------------------------------------------------------

function buildSummary(api: ResumoFinanceiroApi): DashboardSummary {
  const receita = num(api.receitas.mesAtual)
  const receitaAnterior = num(api.receitas.mesAnterior)
  const despesa = num(api.despesas.mesAtual)
  const patrimonio = num(api.patrimonio.patrimonioLiquido)
  const patrimonioBruto = num(api.patrimonio.saldoContas) + num(api.investimentos.valorAtual)

  // Movimentação líquida do mês (entradas - saídas). NÃO é a variação do patrimônio.
  const saldoDoMes = receita - despesa

  return {
    patrimonio: {
      total: round(patrimonio, 2),
      // Variação real = patrimônio atual - patrimônio no início do mês. A API ainda não tem esse
      // histórico, então fica indisponível (null) em vez de usar a movimentação líquida.
      variacao_mes: null,
      variacao_mes_percentual: null,
      movimentacao_liquida_mes: round(saldoDoMes, 2),
      contas_ativas: num(api.nucleoFinanceiro.quantidadeContas || api.resumo.quantidadeContas),
    },
    receita_mensal: {
      valor: round(receita, 2),
      variacao_percentual: api.receitas.variacaoPercentual,
      // Quanto da receita do mês anterior já foi alcançada (máx. 100)
      progresso: receitaAnterior > 0 ? round(clampPercent((receita / receitaAnterior) * 100)) : receita > 0 ? 100 : 0,
    },
    despesas: {
      valor: round(despesa, 2),
      variacao_percentual: api.despesas.variacaoPercentual,
      // Quanto da receita do mês já foi comprometido com despesas (máx. 100)
      progresso: receita > 0 ? round(clampPercent((despesa / receita) * 100)) : despesa > 0 ? 100 : 0,
    },
    limite_cartoes: {
      limite_total: num(api.cartoes.limiteTotal),
      disponivel: num(api.cartoes.limiteDisponivel),
      percentual_disponivel: api.cartoes.percentualDisponivel,
      fatura_aberta: num(api.cartoes.faturaAberta),
    },
    investido: {
      valor: round(num(api.investimentos.valorAtual), 2),
      quantidade: num(api.investimentos.quantidade),
      participacao_percentual:
        patrimonioBruto > 0 ? round((num(api.investimentos.valorAtual) / patrimonioBruto) * 100) : null,
    },
  }
}

// ---- Núcleo financeiro ---------------------------------------------------------------------

function buildCore(api: ResumoFinanceiroApi): CoreItem[] {
  const { cartoes, nucleoFinanceiro, investimentos, emprestimos, patrimonio } = api

  const faturaAberta = num(cartoes.faturaAberta)
  const contas = num(nucleoFinanceiro.quantidadeContas || api.resumo.quantidadeContas)
  const instituicoes = nucleoFinanceiro.instituicoes ?? []

  const categorias = Object.entries(investimentos.porCategoria ?? {})
    .filter(([, valor]) => num(valor) > 0)
    .sort(([, a], [, b]) => num(b) - num(a))
    .map(([chave]) => categoryLabel(chave))
  const rentabilidade = investimentos.rentabilidadeAnualPercentual

  // A API não informa a parcela de forma confiável (hoje vem 0): fica indisponível (null),
  // sem substituir por outro valor (ex.: saldo devedor) até existir uma fonte para calculá-la.
  const parcelaMensal = emprestimos.parcelasMensais > 0 ? emprestimos.parcelasMensais : null

  return [
    {
      id: 'cartoes',
      tipo: 'cartoes',
      titulo: 'Cartões de Crédito',
      descricao: faturaAberta > 0 ? 'Fatura em aberto' : 'Nenhuma fatura em aberto',
      valor: faturaAberta,
      detalhe: cartoes.quantidade === 0 ? 'Nenhum cartão' : plural(cartoes.quantidade, 'cartão', 'cartões'),
      detalheTom: 'neutro',
    },
    {
      id: 'contas',
      tipo: 'contas',
      titulo: 'Contas Conectadas',
      descricao: instituicoes.length
        ? instituicoes.join(', ')
        : contas > 0
          ? plural(contas, 'conta conectada', 'contas conectadas')
          : 'Nenhuma conta conectada',
      valor: num(patrimonio.saldoContas),
      detalhe: contas === 0 ? 'Sem conexão' : api.atualizando ? 'Atualizando' : 'Sincronizadas',
      detalheTom: 'neutro',
    },
    {
      id: 'carteira',
      tipo: 'carteira',
      titulo: 'Carteira Ativa',
      descricao: categorias.length ? categorias.join(', ') : 'Nenhum ativo',
      valor: num(investimentos.valorAtual),
      detalhe:
        rentabilidade === null || rentabilidade === undefined
          ? plural(num(investimentos.quantidade), 'ativo', 'ativos')
          : `${formatPercent(rentabilidade, { signed: true })} ao ano`,
      detalheTom: rentabilidade !== null && rentabilidade !== undefined && rentabilidade > 0 ? 'positivo' : 'neutro',
    },
    {
      id: 'emprestimos',
      tipo: 'emprestimos',
      titulo: 'Empréstimos / Fiança',
      descricao:
        emprestimos.quantidade === 0
          ? 'Nenhum contrato ativo'
          : plural(emprestimos.quantidade, 'contrato', 'contratos'),
      valor: parcelaMensal,
      valorSufixo: parcelaMensal !== null ? '/mês' : undefined,
      detalhe: emprestimos.quantidade === 0 ? '—' : parcelaMensal !== null ? 'Parcela mensal' : 'Parcela indisponível',
      detalheTom: 'neutro',
    },
  ]
}

// ---- Transações ----------------------------------------------------------------------------

function buildTransaction(api: TransacaoApi): DashboardTransaction {
  const value = num(api.valor)
  // O sinal do valor define o sentido. `tipo` (DEBIT/CREDIT) não serve: uma compra no cartão
  // chega como CREDIT com valor negativo. Só se o valor for 0 usamos o tipo como desempate.
  const isIncome = value !== 0 ? value > 0 : api.tipo.toUpperCase() === 'CREDIT'

  const account = [api.instituicao?.trim(), api.contaNome?.trim()].filter(Boolean).join(' · ')

  return {
    id: api.id,
    descricao: api.descricao,
    data: api.data,
    tipo: isIncome ? 'receita' : 'despesa',
    valor: Math.abs(value),
    categoria: api.categoria?.trim() || 'Outros',
    conta: account || null,
  }
}

// ---- Evolução ------------------------------------------------------------------------------

const MONTH_KEY = /^\d{4}-\d{2}$/
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

/** "2026-05" -> "Mai" | "2026-10-28" -> "28/10" | "07" ou qualquer outro texto: como veio */
function evolutionLabel(key: string): string {
  if (MONTH_KEY.test(key)) {
    const text = dayjs(`${key}-01`).locale('pt-br').format('MMM').replace('.', '')
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
  if (DAY_KEY.test(key)) return dayjs(key).format('DD/MM')
  return key
}

/** Mantém a ordem enviada pela API (ela já devolve cronológico). */
export function buildEvolution(api: Pick<ResumoFinanceiroApi, 'evolucao'>): EvolutionPoint[] {
  return (api.evolucao?.dados ?? []).map((item) => ({
    label: evolutionLabel(item.mes ?? item.periodo ?? ''),
    receitas: round(num(item.receitas), 2),
    despesas: round(num(item.despesas), 2),
  }))
}

// ---- Entrada -------------------------------------------------------------------------------

/** Converte a resposta da API financeira no modelo exibido pelo dashboard. */
export function buildOverview(api: ResumoFinanceiroApi): DashboardOverview {
  return {
    updating: Boolean(api.atualizando),
    summary: buildSummary(api),
    core: buildCore(api),
    transactions: (api.ultimasTransacoes ?? []).map(buildTransaction),
    evolution: buildEvolution(api),
  }
}
