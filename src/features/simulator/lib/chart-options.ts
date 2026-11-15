import type { ApexOptions } from 'apexcharts'
import type { AmortizationResult, InvestmentResult } from '../types/simulator.types'
import { formatBRL, formatYearLabel } from './format'

// ApexCharts não lê variáveis CSS: as cores precisam ser literais (mesma paleta das telas).
const INK = '#0a0a0a'
const MUTED = '#737373'
const GRID = '#ececec'
const ACCENT = '#4f46e5'

export interface ChartSeries {
  name: string
  data: number[]
}

interface ChartConfig {
  options: ApexOptions
  series: ChartSeries[]
}

function baseOptions(categories: string[]): ApexOptions {
  const last = categories.length - 1
  return {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      background: 'transparent',
      animations: { enabled: true, speed: 350 },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: GRID,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 16 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      labels: {
        hideOverlappingLabels: true,
        style: {
          fontSize: '12px',
          colors: categories.map((_, index) =>
            index === 0 ? INK : index === last ? ACCENT : MUTED,
          ),
        },
      },
    },
    yaxis: { show: false, min: 0 },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (value: number) => formatBRL(value) },
    },
  }
}

/** "Curva de Aceleração": patrimônio total (área) vs. total investido (tracejado). */
export function buildGrowthChart(serie: InvestmentResult['serie']): ChartConfig {
  const categories = serie.map((point) => formatYearLabel(point.ano))
  return {
    series: [
      { name: 'Total acumulado', data: serie.map((point) => Math.round(point.total * 100) / 100) },
      { name: 'Total investido', data: serie.map((point) => Math.round(point.investido * 100) / 100) },
    ],
    options: {
      ...baseOptions(categories),
      chart: { ...baseOptions(categories).chart, type: 'area' },
      colors: [ACCENT, '#a3a3a3'],
      stroke: { width: [3, 2], curve: 'smooth', dashArray: [0, 6] },
      fill: {
        type: ['gradient', 'solid'],
        opacity: [1, 0],
        gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 100] },
      },
      markers: { size: 0, hover: { size: 5 } },
    },
  }
}

/** "Curva de Amortização": saldo devedor com aporte (sólido) vs. sem amortização (tracejado). */
export function buildAmortizationChart(
  serie: AmortizationResult['serie'],
  quitacaoAno: number | null,
): ChartConfig {
  const categories = serie.map((point) => (point.ano === 0 ? 'Hoje' : formatYearLabel(point.ano)))
  const quitacaoLabel = quitacaoAno !== null ? categories[quitacaoAno] : undefined

  return {
    series: [
      { name: 'Com aporte', data: serie.map((point) => Math.round(point.comAporte * 100) / 100) },
      { name: 'Sem amortização', data: serie.map((point) => Math.round(point.semAporte * 100) / 100) },
    ],
    options: {
      ...baseOptions(categories),
      chart: { ...baseOptions(categories).chart, type: 'line' },
      colors: [ACCENT, '#a3a3a3'],
      stroke: { width: [3, 2], curve: 'straight', dashArray: [0, 6] },
      markers: { size: 0, hover: { size: 5 } },
      annotations: quitacaoLabel
        ? {
            points: [
              {
                x: quitacaoLabel,
                y: 0,
                marker: { size: 5, fillColor: INK, strokeColor: '#ffffff', strokeWidth: 2 },
                label: {
                  text: `Quitação: ${quitacaoLabel}`,
                  offsetY: -10,
                  borderColor: 'transparent',
                  style: {
                    color: '#ffffff',
                    background: INK,
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: { left: 10, right: 10, top: 4, bottom: 4 },
                  },
                },
              },
            ],
          }
        : {},
    },
  }
}
