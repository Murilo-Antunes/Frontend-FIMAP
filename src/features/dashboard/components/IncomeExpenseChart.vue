<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useHiddenValues } from '@/composables/useHiddenValues'
import { formatCurrency } from '@/lib/format'
import type { EvolutionPeriod, EvolutionPoint } from '../types/dashboard.types'

const props = withDefaults(
  defineProps<{
    data: EvolutionPoint[]
    period: EvolutionPeriod
    /** Períodos que a API consegue entregar; os demais aparecem desabilitados. */
    availablePeriods?: EvolutionPeriod[]
    loading?: boolean
    error?: boolean
  }>(),
  { availablePeriods: () => ['dia', 'semana', 'mes'] },
)

const emit = defineEmits<{
  'update:period': [period: EvolutionPeriod]
  retry: []
}>()

const PERIODS: { value: EvolutionPeriod; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
]

const TITLES: Record<EvolutionPeriod, string> = {
  dia: 'Evolução Diária',
  semana: 'Evolução Semanal',
  mes: 'Evolução Mensal',
}

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
    labels: {
      style: { colors: '#9ca3af', fontSize: '12px' },
      hideOverlappingLabels: true,
      formatter: (value: string) => {
        if (props.period === 'dia') {
          const hour = parseInt(value.split(':')[0], 10);
          if (isNaN(hour) || hour % 2 !== 0) {
            return '';
          }
        }
        return value;
      },
    },
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
        <h2 class="text-lg font-semibold">{{ TITLES[period] }}</h2>
        <p class="text-xs text-neutral-500">Receitas vs Despesas</p>
      </div>

      <div class="flex rounded-full bg-neutral-100 p-1" role="group" aria-label="Período do gráfico">
        <button
          v-for="item in PERIODS"
          :key="item.value"
          type="button"
          class="rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-black"
          :class="
            period === item.value
              ? 'bg-black text-white'
              : availablePeriods.includes(item.value)
                ? 'text-neutral-500 hover:text-neutral-900'
                : 'cursor-not-allowed text-neutral-300'
          "
          :aria-pressed="period === item.value"
          :disabled="!availablePeriods.includes(item.value)"
          :title="availablePeriods.includes(item.value) ? undefined : 'Indisponível por enquanto'"
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

      <p
        v-else-if="data.length === 0"
        class="flex h-[260px] items-center justify-center text-sm text-neutral-500"
      >
        Ainda não há movimentações para exibir.
      </p>

      <VueApexCharts v-else type="area" height="260" :options="options" :series="series" />
    </div>
  </section>
</template>
