/**
 * ============================================================
 *  DADOS FICTÍCIOS TEMPORÁRIOS — NÃO SÃO DADOS REAIS
 *  Substituir por chamadas à API quando o contrato existir.
 * ============================================================
 */
import dayjs from 'dayjs'
import type {
  CoreItem,
  DashboardSummary,
  DashboardTransaction,
  EvolutionPeriod,
  EvolutionPoint,
} from '../types/dashboard.types'

export const mockSummary: DashboardSummary = {
  patrimonio: { total: 48920.5, variacaoMes: 1240.8, variacaoMesPercentual: 2.6, contasAtivas: 4 },
  receitaMensal: { valor: 12450, variacaoPercentual: 8, progresso: 72 },
  despesas: { valor: 5820.3, variacaoPercentual: -12, progresso: 38 },
  limiteCartoes: { disponivel: 18500, percentualDisponivel: 68 },
  investido: { valor: 36470.2, percentualMeta: 82 },
}

export const mockEvolution: Record<EvolutionPeriod, EvolutionPoint[]> = {
  dia: [
    { label: '00h', receitas: 0, despesas: 40 },
    { label: '04h', receitas: 0, despesas: 0 },
    { label: '08h', receitas: 0, despesas: 120 },
    { label: '12h', receitas: 1850, despesas: 210 },
    { label: '16h', receitas: 0, despesas: 349 },
    { label: '20h', receitas: 0, despesas: 480 },
  ],
  semana: [
    { label: 'Seg', receitas: 8200, despesas: 6100 },
    { label: 'Ter', receitas: 9800, despesas: 5400 },
    { label: 'Qua', receitas: 9100, despesas: 6600 },
    { label: 'Qui', receitas: 8400, despesas: 5200 },
    { label: 'Sex', receitas: 14850, despesas: 7300 },
    { label: 'Sáb', receitas: 11200, despesas: 6800 },
    { label: 'Dom', receitas: 12450, despesas: 5820 },
  ],
  mes: [
    { label: 'Sem 1', receitas: 11200, despesas: 6400 },
    { label: 'Sem 2', receitas: 12900, despesas: 7100 },
    { label: 'Sem 3', receitas: 10800, despesas: 5900 },
    { label: 'Sem 4', receitas: 12450, despesas: 5820 },
  ],
}

export const mockCore: CoreItem[] = [
  {
    id: 'cartoes',
    tipo: 'cartoes',
    titulo: 'Cartões de Crédito',
    descricao: 'Fatura fecha em 3 dias',
    valor: 2340,
    detalhe: '2 cartões',
    detalheTom: 'neutro',
  },
  {
    id: 'contas',
    tipo: 'contas',
    titulo: 'Contas Conectadas',
    descricao: 'Itaú, Nubank, XP',
    valor: 10110.3,
    detalhe: 'Sincronizadas',
    detalheTom: 'neutro',
  },
  {
    id: 'carteira',
    tipo: 'carteira',
    titulo: 'Carteira Ativa',
    descricao: 'CDB, FIIs e Renda Variável',
    valor: 36470.2,
    detalhe: '+14,2% a.a.',
    detalheTom: 'positivo',
  },
  {
    id: 'emprestimos',
    tipo: 'emprestimos',
    titulo: 'Empréstimos / Fiança',
    descricao: '1 ativo (14/24 parcelas)',
    valor: 420,
    valorSufixo: '/mês',
    detalhe: 'Em dia',
    detalheTom: 'neutro',
  },
]

export const mockTransactions: DashboardTransaction[] = [
  {
    id: 1,
    descricao: 'Apple Store Brasil',
    data: dayjs().hour(14).minute(22).second(0).toISOString(),
    tipo: 'despesa',
    valor: 349,
    categoria: 'Tecnologia',
    detalhe: 'Cartão Black',
  },
  {
    id: 2,
    descricao: 'Transferência Pix Recebida',
    data: dayjs().subtract(1, 'day').hour(19).minute(40).second(0).toISOString(),
    tipo: 'receita',
    valor: 1850,
    categoria: 'Recebimento',
    detalhe: 'Gabriela M.',
  },
  {
    id: 3,
    descricao: 'Restaurante Fasano',
    data: dayjs().subtract(4, 'day').hour(21).minute(15).second(0).toISOString(),
    tipo: 'despesa',
    valor: 480.5,
    categoria: 'Gastronomia',
    detalhe: 'Débito Nubank',
  },
]
