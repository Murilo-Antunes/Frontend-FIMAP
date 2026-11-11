<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { formatBRL } from '@/lib/formatters'
import type { EvolutionPeriod, EvolutionPoint } from '../types/investments.types'

const props = defineProps<{
  points: EvolutionPoint[]
  loading: boolean
  error: string | null
}>()
const period = defineModel<EvolutionPeriod>('period', { required: true })
defineEmits<{ (e: 'retry'): void }>()

const PERIODS: { value: EvolutionPeriod; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '6m', label: '6M' },
  { value: '1a', label: '1A' },
  { value: 'tudo', label: 'Tudo' },
]

const series = computed(() => [{ name: 'Patrimônio', data: props.points.map((p) => ({ x: p.x, y: p.y })) }])

const options = computed<ApexOptions>(() => ({
  chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { enabled: false } },
  colors: ['#0A0A0A'],
  stroke: { curve: 'smooth', width: 2 },
  dataLabels: { enabled: false },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.18, opacityTo: 0, stops: [0, 100] } },
  grid: { borderColor: '#E5E5E5', strokeDashArray: 4, padding: { left: 8, right: 8 } },
  xaxis: {
    type: 'datetime',
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
    labels: {
      style: { colors: '#737373', fontSize: '11px' },
      datetimeUTC: false,
      formatter: (value: string) => dayjs(Number(value)).format(period.value === '1m' ? 'DD MMM' : 'MMM YY').replace('.', ''),
    },
  },
  yaxis: { labels: { show: false } },
  tooltip: {
    x: { formatter: (value: number) => dayjs(value).format('DD/MM/YYYY') },
    y: { formatter: (value: number) => formatBRL(value) },
  },
}))
</script>

<template>
  <section class="rounded-3xl bg-white p-6 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-neutral-900">Evolução Patrimonial</h2>
        <p class="text-sm text-neutral-500">Valorização acumulada no período</p>
      </div>
      <div class="flex rounded-xl bg-neutral-100 p-1" role="tablist" aria-label="Período">
        <button
          v-for="p in PERIODS"
          :key="p.value"
          type="button"
          role="tab"
          :aria-selected="period === p.value"
          class="rounded-lg px-3 py-1 text-xs font-medium transition"
          :class="period === p.value ? 'bg-black text-white' : 'text-neutral-500 hover:text-neutral-900'"
          @click="period = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div class="mt-4 h-[240px]">
      <div v-if="loading" class="h-full animate-pulse rounded-2xl bg-neutral-100" aria-busy="true" />
      <div v-else-if="error" class="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p class="text-sm text-neutral-500">{{ error }}</p>
        <button type="button" class="text-sm font-medium text-neutral-900 underline" @click="$emit('retry')">
          Tentar novamente
        </button>
      </div>
      <p v-else-if="points.length === 0" class="flex h-full items-center justify-center text-sm text-neutral-500">
        Sem histórico para este período.
      </p>
      <VueApexCharts v-else type="area" height="240" :options="options" :series="series" />
    </div>
  </section>
</template>
