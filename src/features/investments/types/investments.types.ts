/**
 * CONTRATO DO BACKEND (confirmado em produção, 11/11/2026 — services/pluggyService.js#listarInvestimentos):
 *
 * GET /v1/openfinance/financeiro/investimentos/:itemId
 *   → { atualizando, total, investimentos: [{ id, nome, tipo, subtipo, valor, moeda, instituicao,
 *        codigo, emissor, quantidade, valorAplicado, lucro, taxa, tipoTaxa, taxaAnual,
 *        rendimentoUltimoMes, rendimentoUltimos12Meses, vencimento, dataSaldo }] }
 *
 * GET /v1/openfinance/financeiro/investimentos/:itemId/evolucao?periodo=1m|6m|1a|tudo   (NÃO EXISTE — CRIAR)
 *   → { evolucao: [{ data: 'YYYY-MM-DD', valor: number }] }
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
