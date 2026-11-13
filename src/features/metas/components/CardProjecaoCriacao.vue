<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import type { ProjecaoIA } from '../composables/useProjecaoIA'
import { formatarMoeda, formatarMesAno } from '../utils/metas.utils'

const props = defineProps<{
  projecao: ProjecaoIA
  valorAtual: number
  valorDesejado: number
  aporteMensal: number
}>()

const percentualAtual = computed(() =>
  props.valorDesejado > 0 ? Math.min((props.valorAtual / props.valorDesejado) * 100, 100) : 0,
)
</script>

<template>
  <div class="rounded-2xl bg-black text-white p-5">
    <div class="flex items-center justify-between mb-3">
      <span class="flex items-center gap-2 text-xs font-medium tracking-wide text-gray-300">
        <Sparkles class="h-4 w-4" />
        PROJEÇÃO COM IA FIMAP
      </span>
      <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
        {{ Math.round(projecao.percentualCdiUsado * 100) }}% CDI
      </span>
    </div>

    <p class="text-sm text-gray-200 leading-relaxed">
      Com um aporte de {{ formatarMoeda(aporteMensal) }}/mês e uma taxa média de
      {{ (0.85 * projecao.percentualCdiUsado).toFixed(2) }}% a.m., você atingirá a meta em
      <span class="underline underline-offset-2">
        {{ projecao.mesesEstimados }} {{ projecao.mesesEstimados === 1 ? 'mês' : 'meses' }}
        ({{ formatarMesAno(projecao.dataEstimada) }})</span
      >,
      <template v-if="projecao.mesesEconomizados > 0">
        economizando <span class="text-emerald-400 font-medium">{{ projecao.mesesEconomizados }} meses</span>
        em relação à poupança comum.
      </template>
      <template v-else> no mesmo ritmo da poupança comum. </template>
    </p>

    <div class="mt-4 flex items-center justify-between text-xs text-gray-400">
      <span>Hoje: {{ formatarMoeda(valorAtual) }}</span>
      <span>Meta: {{ formatarMoeda(valorDesejado) }}</span>
    </div>

    <div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10 flex">
      <div class="h-full bg-white" :style="{ width: `${Math.max(percentualAtual - 4, 0)}%` }" />
      <div class="h-full bg-violet-500" :style="{ width: '35%' }" />
      <div class="h-full bg-emerald-400" :style="{ width: `${Math.max(100 - percentualAtual - 35, 0)}%` }" />
    </div>

    <div class="mt-2 flex items-center gap-4 text-xs text-gray-400">
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-white" />Aporte Atual</span>
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-violet-500" />Rendimentos CDI</span>
      <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-400" />Ganho IA</span>
    </div>
  </div>
</template>
