<script setup lang="ts">
import { computed } from 'vue'
import type { Meta } from '../types/metas.types'
import { formatarMoeda } from '../utils/metas.utils'

const props = defineProps<{ metas: Meta[] }>()

const metasAtivas = computed(() => props.metas.filter((m) => m.status === 1))
const totalAcumulado = computed(() => metasAtivas.value.reduce((soma, m) => soma + m.valorTotal, 0))
const totalDesejado = computed(() => metasAtivas.value.reduce((soma, m) => soma + m.valorDesejado, 0))
const percentual = computed(() =>
  totalDesejado.value > 0 ? Math.min(Math.round((totalAcumulado.value / totalDesejado.value) * 100), 100) : 0,
)
const aporteMedio = computed(() =>
  metasAtivas.value.length > 0
    ? metasAtivas.value.reduce((soma, m) => soma + m.aporteMensal, 0) / metasAtivas.value.length
    : 0,
)
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-6">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium tracking-wide text-gray-400">PROGRESSO GERAL</span>
      <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{{ percentual }}%</span>
    </div>

    <p class="mt-1 text-3xl font-semibold text-gray-900">
      {{ formatarMoeda(totalAcumulado) }}
      <span class="text-base font-normal text-gray-400">/ {{ formatarMoeda(totalDesejado) }}</span>
    </p>

    <div class="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 flex">
      <div class="h-full bg-black" :style="{ width: `${Math.max(percentual - 6, 0)}%` }" />
      <div class="h-full bg-gray-400" :style="{ width: '6%' }" />
      <div class="h-full bg-violet-500" :style="{ width: '4%' }" />
    </div>

    <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
      <span>R$ 0</span>
      <span>Meta Total: {{ formatarMoeda(totalDesejado) }}</span>
    </div>

    <p class="mt-3 text-sm text-gray-500">
      <span class="text-gray-900 font-medium">{{ metasAtivas.length }}</span>
      {{ metasAtivas.length === 1 ? 'meta ativa' : 'metas ativas' }}
      · Economia média: {{ formatarMoeda(aporteMedio) }}/mês
    </p>
  </div>
</template>
