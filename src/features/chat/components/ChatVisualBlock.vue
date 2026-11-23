<script setup lang="ts">
import { CircleAlert, Info } from 'lucide-vue-next'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { VisualBlock } from '../services/assistant-content'

defineProps<{ block: VisualBlock }>()

const calloutLabels = {
  resumo: 'Resumo',
  informacao: 'Informação',
  atencao: 'Atenção',
  dica: 'Dica',
  comparacao: 'Comparação',
  recomendacao: 'Recomendação',
}

const formatMetric = {
  BRL: formatCurrency,
  percent: formatPercent,
  number: new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format,
}
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5 sm:p-4" :aria-label="block.title || 'Dados da resposta'">
    <div v-if="block.title || block.summary" class="space-y-1">
      <h3 v-if="block.title" class="font-semibold tracking-tight text-neutral-950">{{ block.title }}</h3>
      <p v-if="block.summary" class="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{{ block.summary }}</p>
    </div>

    <dl v-if="block.metrics.length" class="chat-metrics grid gap-2.5">
      <div v-for="(metric, index) in block.metrics" :key="index" class="min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 sm:px-3.5 sm:py-3">
        <dt class="text-xs leading-relaxed text-neutral-600">{{ metric.label }}</dt>
        <dd class="mt-1 text-lg leading-tight font-semibold tracking-tight text-neutral-950 tabular-nums">{{ formatMetric[metric.format](metric.value) }}</dd>
      </div>
    </dl>

    <div v-if="block.bars?.length" class="space-y-3">
      <div v-for="(bar, index) in block.bars" :key="index">
        <div class="mb-1 flex items-baseline justify-between gap-2 text-sm font-medium text-neutral-800">
          <span>{{ bar.label }}</span>
          <span class="shrink-0 tabular-nums">{{ formatPercent(bar.value / bar.total * 100) }}</span>
        </div>
        <progress class="chat-progress block h-2 w-full" :max="bar.total" :value="bar.value" :aria-label="bar.label" />
      </div>
    </div>

    <div v-if="block.callouts?.length" class="space-y-2.5">
      <div v-for="(callout, index) in block.callouts" :key="index" class="flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-relaxed"
        :class="callout.type === 'atencao' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-neutral-200 bg-white text-neutral-800'">
        <CircleAlert v-if="callout.type === 'atencao'" :size="16" class="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <Info v-else :size="16" class="mt-0.5 shrink-0 text-neutral-500" aria-hidden="true" />
        <div class="min-w-0">
          <p class="font-semibold">{{ calloutLabels[callout.type] }}</p>
          <p class="whitespace-pre-line">{{ callout.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chat-metrics { grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); }
.chat-progress { overflow: hidden; border: 0; border-radius: 999px; background: var(--color-neutral-200); accent-color: var(--color-neutral-800); }
.chat-progress::-webkit-progress-bar { border-radius: 999px; background: var(--color-neutral-200); }
.chat-progress::-webkit-progress-value { border-radius: 999px; background: var(--color-neutral-800); }
.chat-progress::-moz-progress-bar { border-radius: 999px; background: var(--color-neutral-800); }
</style>
