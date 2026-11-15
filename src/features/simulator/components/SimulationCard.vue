<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, LoaderCircle, X, Zap } from 'lucide-vue-next'
import { formatBRL, formatPrazoBadge } from '../lib/format'
import type { HistoryEntry } from '../types/simulator.types'

const props = defineProps<{
  entry: HistoryEntry
  deleting?: boolean
}>()

defineEmits<{ open: []; remove: [] }>()

const view = computed(() => {
  const entry = props.entry
  return entry.kind === 'investimentos'
    ? {
        badge: `PRAZO ESTIMADO • ${formatPrazoBadge(entry.data.prazo)}`,
        metricLabel: 'Aporte Inicial',
        metricValue: formatBRL(entry.data.valor_inicial),
        action: 'Visualizar Investimento',
      }
    : {
        badge: `PRAZO RESTANTE • ${formatPrazoBadge(entry.data.prazo)}`,
        metricLabel: 'Saldo Devedor',
        metricValue: formatBRL(entry.data.saldo_devedor),
        action: 'Visualizar Amortização',
      }
})
</script>

<template>
  <article
    class="flex flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
  >
    <header class="flex items-center justify-between gap-3">
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white"
      >
        <Zap class="size-3 fill-current" aria-hidden="true" />
        {{ view.badge }}
      </span>
      <button
        type="button"
        :aria-label="`Excluir simulação ${entry.data.nome}`"
        :disabled="deleting"
        class="grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        @click="$emit('remove')"
      >
        <LoaderCircle v-if="deleting" class="size-4 animate-spin" aria-hidden="true" />
        <X v-else class="size-4" aria-hidden="true" />
      </button>
    </header>

    <h3 class="mt-4 text-lg font-medium text-neutral-950">{{ entry.data.nome }}</h3>
    <p class="mt-1.5 line-clamp-4 text-sm leading-relaxed text-neutral-500">
      {{ entry.data.descricao }}
    </p>

    <div class="mt-auto pt-4">
      <div class="flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3">
        <span class="text-xs text-neutral-500">{{ view.metricLabel }}</span>
        <span class="text-base font-bold tabular-nums text-neutral-950">{{ view.metricValue }}</span>
      </div>
      <button
        type="button"
        class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        @click="$emit('open')"
      >
        {{ view.action }}
        <ArrowRight class="size-4" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>
