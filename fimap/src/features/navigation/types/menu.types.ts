/** Resposta de GET /menu/resumo. As chaves (cards, accounts...) são as de config/navigation.ts. */
export interface MenuSummaryApiResponse {
  itens: {
    cards: { quantidade: number; total_faturas_abertas: number; dias_para_fechamento: number | null }
    accounts: { quantidade: number; instituicoes: string[]; saldo_total: number }
    investments: { quantidade_ativos: number; valor_total: number }
    loans: { contratos_ativos: number; parcela_mensal_total: number }
    settings: { conexoes_total: number; conexoes_pendentes: number }
    opportunities: { quantidade: number }
  }
}

/** Descrição de cada item do menu, indexada pela `key` do NavItem. */
export type MenuDescriptions = Partial<Record<string, string>>
