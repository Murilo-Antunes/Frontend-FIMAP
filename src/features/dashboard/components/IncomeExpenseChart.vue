<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useHiddenValues } from '@/composables/useHiddenValues'
import { formatCurrency } from '@/lib/format'
import type { EvolutionPeriod, EvolutionPoint } from '../types/dashboard.types'

const props = defineProps<{
  data: EvolutionPoint[]
  period: EvolutionPeriod
  loading?: boolean
  error?: boolean
}>()

const emit = defineEmits<{
  'update:period': [period: EvolutionPeriod]
  retry: []
}>()

const PERIODS: { value: EvolutionPeriod; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

const { mask } = useHiddenValues()
const reducedMotion = usePreferredReducedMotion()

const series = computed(() => [
  { name: 'Receitas', data: props.data.map((point) => point.receitas) },
  { name: 'Despesas', data: props.data.map((point) => point.despesas) },
])

const options = computed<ApexOptions>(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { enabled: reducedMotion.value !== 'reduce' },
  },
  colors: ['#0a0a0a', '#b4b4b4'],
  stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.1, opacityTo: 0, stops: [0, 100] },
  },
  dataLabels: { enabled: false },
  grid: {
    borderColor: '#eeeeee',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: props.data.map((point) => point.label),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#9ca3af', fontSize: '12px' } },
    tooltip: { enabled: false },
  },
  yaxis: { show: false },
  markers: { size: 0, hover: { size: 5 } },
  legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', markers: { size: 5 } },
  tooltip: {
    theme: 'dark',
    shared: true,
    intersect: false,
    y: { formatter: (value: number) => mask(formatCurrency(value)) },
  },
}))
</script>

<template>
  <section class="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Evolução Mensal</h2>
        <p class="text-xs text-neutral-500">Receitas vs Despesas</p>
      </div>

      <div class="flex rounded-full bg-neutral-100 p-1" role="group" aria-label="Período do gráfico">
        <button
          v-for="item in PERIODS"
          :key="item.value"
          type="button"
          class="rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-black"
          :class="period === item.value ? 'bg-black text-white' : 'text-neutral-500 hover:text-neutral-900'"
          :aria-pressed="period === item.value"
          @click="emit('update:period', item.value)"
        >
          {{ item.label }}
        </button>
      </div>
    </header>

    <div class="mt-4 min-h-[260px]" :aria-busy="loading">
      <div
        v-if="error"
        class="flex h-[260px] flex-col items-center justify-center gap-3 text-center text-sm text-neutral-500"
        role="alert"
      >
        Não foi possível carregar o gráfico.
        <button
          type="button"
          class="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50"
          @click="emit('retry')"
        >
          Tentar novamente
        </button>
      </div>

      <div v-else-if="loading" class="h-[260px] animate-pulse rounded-2xl bg-neutral-100" />

      <VueApexCharts v-else type="area" height="260" :options="options" :series="series" />
    </div>
  </section>
</template>
