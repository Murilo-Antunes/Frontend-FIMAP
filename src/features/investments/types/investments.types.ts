/**
 * CONTRATO ASSUMIDO DO BACKEND (confirmar com o controller):
 *
 * GET /v1/openfinance/financeiro/investimentos/:itemId            (JÁ EXISTE no router)
 *   → { sucesso, investimentos: [{ id, name, type, subtype, balance, amountOriginal, amountProfit,
 *        quantity, code, issuer, rate, rateType, lastMonthRate, lastTwelveMonthsRate, currencyCode, date }] }
 *
 * GET /v1/openfinance/financeiro/investimentos/:itemId/evolucao?periodo=1m|6m|1a|tudo   (NÃO EXISTE — CRIAR)
 *   → { sucesso, evolucao: [{ data: 'YYYY-MM-DD', valor: number }] }
 *
 * Os campos seguem o formato do Pluggy. Se o backend renomeia, ajuste só investments.mapper.ts.
 */

export type AssetClassKey = 'renda-fixa' | 'acoes-etfs' | 'fiis' | 'fundos' | 'cripto-internacional' | 'outros'

export interface PortfolioAsset {
  id: string
  name: string
  classKey: AssetClassKey
  classLabel: string
  /** Segunda linha do card: emissor/tipo • taxa ou cotas. */
  subtitle: string
  /** Selo de destaque (ex.: "110% CDI", "+18,4% em 12m"). */
  badge: string | null
  code: string | null
  balance: number
  invested: number | null
  profit: number | null
  profitPct: number | null
}

export interface AssetClassGroup {
  key: AssetClassKey
  label: string
  total: number
  pct: number
  assets: PortfolioAsset[]
  /** Exemplos para o resumo (ex.: "CDB, Tesouro Direto"). */
  examples: string
  color: string
}

export interface PortfolioSummary {
  total: number
  profit: number | null
  profitPct: number | null
  /** Estimativa em R$ do rendimento do último mês (a partir de lastMonthRate). */
  monthYield: number | null
  /** Rentabilidade ponderada dos últimos 12 meses, em %. */
  twelveMonthsPct: number | null
  groups: AssetClassGroup[]
  assets: PortfolioAsset[]
}

export type EvolutionPeriod = '1m' | '6m' | '1a' | 'tudo'

export interface EvolutionPoint {
  /** Timestamp em ms (eixo datetime do ApexCharts). */
  x: number
  y: number
}
