<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexAxisChartSeries, ApexOptions } from 'apexcharts'

const props = defineProps<{
  type: 'area' | 'line'
  options: ApexOptions
  series: ApexAxisChartSeries
  /** Descrição textual para leitores de tela */
  summary: string
  height?: number
}>()

// Troca de tipo exige remontar o gráfico no ApexCharts.
const chartKey = computed(() => `${props.type}-${props.series[0]?.data.length ?? 0}`)
</script>

<template>
  <div role="img" :aria-label="summary">
    <VueApexCharts
      :key="chartKey"
      :type="type"
      :height="height ?? 280"
      :options="options"
      :series="series"
    />
  </div>
</template>
