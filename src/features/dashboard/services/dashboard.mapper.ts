import { formatPercent } from '@/lib/format'
import type { CoreItem, DashboardCoreData } from '../types/dashboard.types'

const ASSET_LABELS: Record<string, string> = {
  renda_fixa: 'Renda Fixa',
  tesouro: 'Tesouro Direto',
  fii: 'FIIs',
  acao: 'Ações',
  fundo: 'Fundos',
  cripto: 'Cripto',
}

function assetLabel(type: string): string {
  if (ASSET_LABELS[type]) return ASSET_LABELS[type]
  const text = type.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

/** Transforma os números do "nucleo" da API nos itens (com textos) exibidos no card. */
export function buildCoreItems(core: DashboardCoreData): CoreItem[] {
  const { cartoes, contas, carteira, emprestimos } = core

  const fechamento =
    cartoes.dias_para_fechamento === null
      ? cartoes.total_faturas_abertas > 0
        ? 'Fatura em aberto'
        : 'Nenhuma fatura em aberto'
      : cartoes.dias_para_fechamento === 0
        ? 'Fatura fecha hoje'
        : `Fatura fecha em ${plural(cartoes.dias_para_fechamento, 'dia', 'dias')}`

  const sync =
    contas.conexoes_total === 0 ? 'Sem conexão' : contas.todas_sincronizadas ? 'Sincronizadas' : 'Atenção'

  const rentabilidade = carteira.rentabilidade_percentual

  const parcelas =
    emprestimos.parcelas_total !== null
      ? `1 ativo (${emprestimos.parcelas_pagas}/${emprestimos.parcelas_total} parcelas)`
      : `${emprestimos.contratos_ativos} ativos`

  return [
    {
      id: 'cartoes',
      tipo: 'cartoes',
      titulo: 'Cartões de Crédito',
      descricao: fechamento,
      valor: cartoes.total_faturas_abertas,
      detalhe: cartoes.quantidade_cartoes === 0 ? 'Nenhum cartão' : plural(cartoes.quantidade_cartoes, 'cartão', 'cartões'),
      detalheTom: 'neutro',
    },
    {
      id: 'contas',
      tipo: 'contas',
      titulo: 'Contas Conectadas',
      descricao: contas.instituicoes.length ? contas.instituicoes.join(', ') : 'Nenhuma conta conectada',
      valor: contas.saldo_total,
      detalhe: sync,
      detalheTom: 'neutro',
    },
    {
      id: 'carteira',
      tipo: 'carteira',
      titulo: 'Carteira Ativa',
      descricao: carteira.tipos_ativos.length
        ? carteira.tipos_ativos.map(assetLabel).join(', ')
        : 'Nenhum ativo',
      valor: carteira.valor_total,
      detalhe:
        rentabilidade === null
          ? plural(carteira.quantidade_ativos, 'ativo', 'ativos')
          : `${formatPercent(rentabilidade, { signed: true })} no total`,
      detalheTom: rentabilidade !== null && rentabilidade > 0 ? 'positivo' : 'neutro',
    },
    {
      id: 'emprestimos',
      tipo: 'emprestimos',
      titulo: 'Empréstimos / Fiança',
      descricao: emprestimos.contratos_ativos === 0 ? 'Nenhum contrato ativo' : parcelas,
      valor: emprestimos.parcela_mensal_total,
      valorSufixo: emprestimos.parcela_mensal_total > 0 ? '/mês' : undefined,
      detalhe: emprestimos.contratos_ativos === 0 ? '—' : emprestimos.em_dia ? 'Em dia' : 'Em atraso',
      detalheTom: 'neutro',
    },
  ]
}
