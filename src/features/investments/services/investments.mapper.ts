import dayjs from 'dayjs'
import { asNumber, asString, extractList, type RawRecord } from '@/lib/api/extract'
import { formatPercent, formatQuantity, formatSignedPercent } from '@/lib/formatters'
import type {
  AssetClassGroup,
  AssetClassKey,
  EvolutionPoint,
  PortfolioAsset,
  PortfolioSummary,
} from '../types/investments.types'

const CLASS_LABEL: Record<AssetClassKey, string> = {
  'renda-fixa': 'Renda Fixa',
  'acoes-etfs': 'Ações & ETFs',
  fiis: 'Fundos Imobiliários',
  fundos: 'Fundos de Investimento',
  'cripto-internacional': 'Cripto & Internacional',
  outros: 'Outros',
}

/** Preto → cinzas, como na barra de alocação do design. */
const GROUP_COLORS = ['#0A0A0A', '#525252', '#737373', '#A3A3A3', '#D4D4D4', '#E5E5E5']

const SUBTYPE_LABEL: Record<string, string> = {
  TREASURY: 'Tesouro Direto',
  CDB: 'CDB',
  LCI: 'LCI',
  LCA: 'LCA',
  LC: 'LC',
  DEBENTURE: 'Debênture',
  CRI: 'CRI',
  CRA: 'CRA',
  STOCK: 'Ação',
  ETF: 'ETF',
  BDR: 'BDR',
  REAL_ESTATE_FUND: 'Fundo Imobiliário',
  RETIREMENT: 'Previdência',
}

function humanize(value: string): string {
  const text = value.toLowerCase().replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function resolveClass(raw: RawRecord): AssetClassKey {
  const type = (asString(raw.tipo ?? raw.type) ?? '').toUpperCase()
  const subtype = (asString(raw.subtipo ?? raw.subtype) ?? '').toUpperCase()
  const name = (asString(raw.nome ?? raw.name) ?? '').toUpperCase()
  const currency = (asString(raw.moeda ?? raw.currencyCode) ?? 'BRL').toUpperCase()

  if (subtype.includes('CRYPTO') || currency !== 'BRL') return 'cripto-internacional'
  if (subtype === 'REAL_ESTATE_FUND' || /\bFII\b/.test(name)) return 'fiis'
  if (type === 'EQUITY' || type === 'ETF' || ['STOCK', 'ETF', 'BDR'].includes(subtype)) return 'acoes-etfs'
  if (type === 'FIXED_INCOME' || type === 'COE' || subtype === 'TREASURY') return 'renda-fixa'
  if (type === 'MUTUAL_FUND') return 'fundos'
  return 'outros'
}

function rateLabel(raw: RawRecord): string | null {
  const rate = asNumber(raw.taxa ?? raw.rate)
  const rateType = (asString(raw.tipoTaxa ?? raw.rateType) ?? '').toUpperCase()
  if (rate === null || rate === 0) return null
  const value = formatPercent(rate, Number.isInteger(rate) ? 0 : 1)
  switch (rateType) {
    case 'CDI':
      return `${value} do CDI`
    case 'SELIC':
      return `${value} da Selic`
    case 'IPCA':
      return `IPCA + ${value}`
    case 'PRE':
      return `${value} a.a.`
    default:
      return null
  }
}

function mapAsset(raw: RawRecord): PortfolioAsset | null {
  const id = asString(raw.id)
  const balance = asNumber(raw.saldo ?? raw.balance)
  if (!id || balance === null) return null

  const classKey = resolveClass(raw)
  const subtype = (asString(raw.subtipo ?? raw.subtype) ?? '').toUpperCase()
  const rate = rateLabel(raw)
  const quantity = asNumber(raw.quantidade ?? raw.quantity)
  const twelve = asNumber(raw.rendimento12Meses ?? raw.lastTwelveMonthsRate)

  const invested = asNumber(raw.valorInvestido ?? raw.valorAplicado ?? raw.amountOriginal)
  const profit = asNumber(raw.rendimento ?? raw.amountProfit) ?? (invested !== null ? balance - invested : null)
  const profitPct = profit !== null && invested !== null && invested > 0 ? (profit / invested) * 100 : null

  const issuer = asString(raw.emissor ?? raw.issuer)
  const typeLabel = SUBTYPE_LABEL[subtype] ?? (subtype ? humanize(subtype) : CLASS_LABEL[classKey])
  const quantityLabel =
    quantity !== null && (classKey === 'acoes-etfs' || classKey === 'fiis' || classKey === 'fundos')
      ? `${formatQuantity(quantity)} ${subtype === 'STOCK' ? (quantity === 1 ? 'ação' : 'ações') : quantity === 1 ? 'cota' : 'cotas'}`
      : null

  return {
    id,
    name: asString(raw.nome ?? raw.name) ?? 'Ativo',
    classKey,
    classLabel: CLASS_LABEL[classKey],
    subtitle: [issuer ?? typeLabel, quantityLabel ?? rate].filter(Boolean).join(' • '),
    badge: rate ?? (twelve !== null ? `${formatSignedPercent(twelve)} em 12m` : null),
    code: asString(raw.codigo ?? raw.code),
    balance,
    invested,
    profit,
    profitPct,
  }
}

export function mapInvestments(data: unknown): { assets: PortfolioAsset[]; monthYield: number; monthYieldKnown: boolean; twelveWeighted: [number, number] } {
  const rawList = extractList(data, ['investimentos', 'investments', 'results'])
  const assets: PortfolioAsset[] = []
  let monthYield = 0
  let monthYieldKnown = false
  let twelveSum = 0
  let twelveBase = 0

  for (const raw of rawList) {
    const asset = mapAsset(raw)
    if (!asset) continue
    assets.push(asset)

    const monthRate = asNumber(raw.rendimentoMes ?? raw.lastMonthRate)
    if (monthRate !== null) {
      monthYield += (asset.balance * monthRate) / (100 + monthRate)
      monthYieldKnown = true
    }
    const twelve = asNumber(raw.rendimento12Meses ?? raw.lastTwelveMonthsRate)
    if (twelve !== null && asset.balance > 0) {
      twelveSum += asset.balance * twelve
      twelveBase += asset.balance
    }
  }
  return { assets, monthYield, monthYieldKnown, twelveWeighted: [twelveSum, twelveBase] }
}

export function buildSummary(
  parts: ReturnType<typeof mapInvestments>[],
): PortfolioSummary {
  const assets = parts.flatMap((p) => p.assets).sort((a, b) => b.balance - a.balance)
  const total = assets.reduce((sum, a) => sum + a.balance, 0)

  const withProfit = assets.filter((a) => a.profit !== null && a.invested !== null && a.invested > 0)
  const profit = withProfit.length > 0 ? withProfit.reduce((s, a) => s + (a.profit ?? 0), 0) : null
  const invested = withProfit.reduce((s, a) => s + (a.invested ?? 0), 0)
  const profitPct = profit !== null && invested > 0 ? (profit / invested) * 100 : null

  const monthKnown = parts.some((p) => p.monthYieldKnown)
  const monthYield = monthKnown ? parts.reduce((s, p) => s + p.monthYield, 0) : null
  const twelveBase = parts.reduce((s, p) => s + p.twelveWeighted[1], 0)
  const twelveSum = parts.reduce((s, p) => s + p.twelveWeighted[0], 0)

  const byClass = new Map<AssetClassKey, PortfolioAsset[]>()
  for (const asset of assets) byClass.set(asset.classKey, [...(byClass.get(asset.classKey) ?? []), asset])

  const groups: AssetClassGroup[] = [...byClass.entries()]
    .map(([key, list]) => {
      const groupTotal = list.reduce((s, a) => s + a.balance, 0)
      return { key, list, groupTotal }
    })
    .sort((a, b) => b.groupTotal - a.groupTotal)
    .map(({ key, list, groupTotal }, index): AssetClassGroup => ({
      key,
      label: CLASS_LABEL[key],
      total: groupTotal,
      pct: total > 0 ? (groupTotal / total) * 100 : 0,
      assets: list,
      examples: list
        .slice(0, 2)
        .map((a) => a.code ?? a.name)
        .join(', '),
      color: GROUP_COLORS[index % GROUP_COLORS.length],
    }))

  return {
    total,
    profit,
    profitPct,
    monthYield,
    twelveMonthsPct: twelveBase > 0 ? twelveSum / twelveBase : null,
    groups,
    assets,
  }
}

export function mapEvolution(data: unknown): Map<string, number> {
  const byDay = new Map<string, number>()
  for (const raw of extractList(data, ['evolucao', 'evolution', 'results'])) {
    const date = asString(raw.data ?? raw.date)
    const value = asNumber(raw.valor ?? raw.value)
    if (!date || value === null || !dayjs(date).isValid()) continue
    const key = dayjs(date).format('YYYY-MM-DD')
    byDay.set(key, (byDay.get(key) ?? 0) + value)
  }
  return byDay
}

/** Soma, dia a dia, a evolução de várias conexões. */
export function mergeEvolutions(maps: Map<string, number>[]): EvolutionPoint[] {
  const merged = new Map<string, number>()
  for (const map of maps) for (const [day, value] of map) merged.set(day, (merged.get(day) ?? 0) + value)
  return [...merged.entries()]
    .map(([day, value]): EvolutionPoint => ({ x: dayjs(day).valueOf(), y: value }))
    .sort((a, b) => a.x - b.x)
}