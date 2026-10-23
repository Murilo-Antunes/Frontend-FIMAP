import { formatCurrency } from '@/lib/format'
import type { MenuDescriptions, MenuSummaryApiResponse } from '../types/menu.types'

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`

/** Monta o texto de apoio de cada item do menu a partir dos números da API. */
export function buildMenuDescriptions(itens: MenuSummaryApiResponse['itens']): MenuDescriptions {
  const { cards, accounts, investments, loans, settings, opportunities } = itens

  return {
    cards:
      cards.quantidade === 0
        ? 'Nenhum cartão conectado'
        : `${plural(cards.quantidade, 'cartão', 'cartões')} · faturas ${formatCurrency(cards.total_faturas_abertas)}`,
    accounts:
      accounts.quantidade === 0
        ? 'Nenhuma conta conectada'
        : `${plural(accounts.quantidade, 'conta', 'contas')} · ${formatCurrency(accounts.saldo_total)}`,
    investments:
      investments.quantidade_ativos === 0
        ? 'Nenhum ativo na carteira'
        : `${plural(investments.quantidade_ativos, 'ativo', 'ativos')} · ${formatCurrency(investments.valor_total)}`,
    loans:
      loans.contratos_ativos === 0
        ? 'Nenhum contrato ativo'
        : `${plural(loans.contratos_ativos, 'contrato', 'contratos')} · ${formatCurrency(loans.parcela_mensal_total)}/mês`,
    settings:
      settings.conexoes_pendentes > 0
        ? `${plural(settings.conexoes_pendentes, 'conexão pendente', 'conexões pendentes')}`
        : 'Personalize sua experiência',
    opportunities:
      opportunities.quantidade === 0
        ? 'Nenhum insight disponível'
        : `${plural(opportunities.quantidade, 'insight', 'insights')} de economia`,
  }
}
