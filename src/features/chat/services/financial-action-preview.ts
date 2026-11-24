import type { ApexAxisChartSeries, ApexOptions } from 'apexcharts'
import { calculateAmortization } from '@/features/simulator/lib/amortization'
import { formatBRL, formatDuration, formatPercent, roundMoney } from '@/features/simulator/lib/format'
import { calculateInvestment } from '@/features/simulator/lib/investment'
import {
  amortizationProjectionSchema, goalProjectionSchema, investmentProjectionSchema, type FinancialAction,
} from '../schemas/financial-action.schemas'

type Metric = { label: string; value: string; attention?: boolean }
type Point = { month: number; projected: number; reference: number }

interface Projection {
  heading: string
  note: string
  labels: [string, string]
  metrics: Metric[]
  points: Point[]
  markedMonth?: number
}

function projectGoal(data: unknown): Projection | undefined {
  const parsed = goalProjectionSchema.safeParse(data)
  if (!parsed.success) return
  const { valor_inicio, aporte_mensal, valor_desejado, prazo } = parsed.data
  const total = roundMoney(valor_inicio + aporte_mensal * prazo)
  const difference = roundMoney(valor_desejado - total)
  return {
    heading: 'Projeção até a data-alvo',
    note: 'Aportes mensais sem considerar rendimentos.',
    labels: ['Saldo projetado', 'Valor da meta'],
    metrics: [
      { label: 'Total projetado', value: formatBRL(total) },
      { label: 'Valor da meta', value: formatBRL(valor_desejado) },
      {
        label: difference < 0 ? 'Acima da meta' : 'Falta para a meta',
        value: formatBRL(Math.abs(difference)),
        attention: difference > 0,
      },
    ],
    points: Array.from({ length: prazo + 1 }, (_, month) => ({
      month, projected: roundMoney(valor_inicio + aporte_mensal * month), reference: valor_desejado,
    })),
  }
}

function projectInvestment(data: unknown): Projection | undefined {
  const parsed = investmentProjectionSchema.safeParse(data)
  if (!parsed.success) return
  const { valor_inicial, aporte_mensal, prazo, rentabilidade } = parsed.data
  const result = calculateInvestment({
    valorInicial: valor_inicial,
    aporteMensal: aporte_mensal,
    prazoMeses: prazo,
    rentabilidadeAa: rentabilidade,
    poupancaAa: null,
    ipcaAa: null,
  }, 1)
  if (!result) return
  return {
    heading: 'Evolução do investimento',
    note: 'Projeção bruta com aportes no fim do mês, sem descontar impostos e taxas.',
    labels: ['Saldo projetado', 'Capital aportado'],
    metrics: [
      { label: 'Saldo no fim do prazo', value: formatBRL(result.total) },
      { label: 'Capital aportado', value: formatBRL(result.aportes) },
      { label: 'Rendimento estimado', value: formatBRL(result.juros), attention: result.juros < 0 },
    ],
    points: result.serie.map(row => ({
      month: Math.round(row.ano * 12), projected: roundMoney(row.total), reference: roundMoney(row.investido),
    })),
  }
}

function projectAmortization(data: unknown): Projection | undefined {
  const parsed = amortizationProjectionSchema.safeParse(data)
  if (!parsed.success) return
  const { saldo_devedor, aporte_mensal, prazo, taxa, sistema_calculo, modalidade } = parsed.data
  const result = calculateAmortization({
    saldoDevedor: saldo_devedor,
    extraMensal: aporte_mensal,
    prazoMeses: prazo,
    taxaAa: taxa,
    sistema: sistema_calculo,
    modalidade,
  }, 1)
  if (!result) return
  return {
    heading: 'Evolução do saldo devedor',
    note: 'Comparação com o contrato atual. O aporte extra é aplicado após cada parcela.',
    labels: ['Com aporte extra', 'Sem aporte extra'],
    metrics: [
      { label: 'Economia de juros', value: formatBRL(Math.max(0, roundMoney(result.economia))) },
      { label: 'Quitação com aporte', value: formatDuration(result.meses) },
      { label: 'Quitação sem aporte', value: formatDuration(result.mesesOriginal) },
    ],
    points: result.serie.map(row => ({
      month: Math.round(row.ano * 12), projected: roundMoney(row.comAporte), reference: roundMoney(row.semAporte),
    })),
    markedMonth: result.meses,
  }
}

const project = {
  meta: projectGoal,
  investimento: projectInvestment,
  amortizacao: projectAmortization,
}

export const projectionColors = ['#4338ca', '#737373']
const compactBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
})
const monthLabel = (value: number) => value === 0 ? 'Início' : `Mês ${Math.round(value)}`

export function buildFinancialActionPreview(action: FinancialAction) {
  const projection = project[action.tipo](action.dados)
  if (!projection) return

  const { points, markedMonth, ...details } = projection
  const lastMonth = points.length - 1
  const interval = Math.max(1, Math.ceil(lastMonth / 48))
  const samples = points.filter(({ month }) =>
    month % interval === 0 || month === lastMonth || month === markedMonth,
  )
  const peak = Math.max(...samples.map(point => Math.max(point.projected, point.reference)))
  const series: ApexAxisChartSeries = [
    { name: details.labels[0], data: samples.map(row => ({ x: row.month, y: row.projected })) },
    { name: details.labels[1], data: samples.map(row => ({ x: row.month, y: row.reference })) },
  ]
  const options: ApexOptions = {
    chart: {
      type: 'area', fontFamily: 'inherit', parentHeightOffset: 0,
      animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false },
    },
    colors: projectionColors,
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: '#e5e7eb', strokeDashArray: 4, padding: { left: 2, right: 12 } },
    stroke: { curve: 'straight', width: [2.5, 2], dashArray: [0, 5] },
    fill: {
      type: ['gradient', 'solid'], opacity: [1, 0],
      gradient: { opacityFrom: 0.19, opacityTo: 0.02, stops: [0, 100] },
    },
    xaxis: {
      type: 'numeric', min: 0, max: lastMonth, tickAmount: Math.min(lastMonth, 4),
      labels: { formatter: (value) => monthLabel(Number(value)), rotate: 0, style: { fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false },
    },
    yaxis: {
      min: 0, max: peak || 1, tickAmount: 4,
      labels: { formatter: (value) => compactBRL.format(value), style: { fontSize: '10px' } },
    },
    tooltip: { shared: true, intersect: false, x: { formatter: monthLabel }, y: { formatter: formatBRL } },
  }
  const summary = [details.heading, ...details.metrics.map(({ label, value }) => `${label} ${value}`)].join('. ')
  return { ...details, options, series, summary }
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' })
const moneyValue = (value?: number) => value === undefined ? undefined : formatBRL(value)
const monthsValue = (value?: number) => value === undefined ? undefined : formatDuration(value)
const annualRate = (value?: number) => value === undefined ? undefined : `${formatPercent(value)}% a.a.`

export function describeFinancialAction(action: FinancialAction) {
  const terms: [string, string | undefined][] = [[
    action.tipo === 'amortizacao' ? 'Aporte extra mensal' : 'Aporte mensal', moneyValue(action.dados.aporte_mensal),
  ]]
  const fields: [string, string | undefined][] = []
  if (action.tipo === 'meta') {
    const { valor_inicio, valor_desejado, data_alvo, categoria, prazo } = action.dados
    terms.push(['Data-alvo', data_alvo && dateFormat.format(new Date(data_alvo))])
    fields.push(
      ['Já guardado', moneyValue(valor_inicio)],
      ['Valor da meta', moneyValue(valor_desejado)],
      ['Prazo', monthsValue(prazo)],
      ['Categoria', categoria],
    )
  } else if (action.tipo === 'investimento') {
    const { valor_inicial, prazo, rentabilidade } = action.dados
    terms.push(['Prazo', monthsValue(prazo)], ['Rentabilidade', annualRate(rentabilidade)])
    fields.push(['Valor inicial', moneyValue(valor_inicial)])
  } else {
    const { saldo_devedor, prazo, taxa, sistema_calculo, modalidade } = action.dados
    terms.push(['Prazo contratual', monthsValue(prazo)], ['Juros do contrato', annualRate(taxa)])
    fields.push(
      ['Saldo devedor', moneyValue(saldo_devedor)], ['Sistema', sistema_calculo === 'PRICE' ? 'Price' : sistema_calculo],
      ['Modalidade', modalidade && (modalidade === 'REDUZIR_PRAZO' ? 'Reduzir prazo' : 'Reduzir parcela')],
    )
  }
  return {
    terms: terms.filter(([, value]) => value !== undefined),
    fields: fields.filter(([, value]) => value !== undefined),
  }
}
