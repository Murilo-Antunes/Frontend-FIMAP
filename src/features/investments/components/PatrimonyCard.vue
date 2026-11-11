<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import { formatBRL, formatPercent, formatSignedBRL, formatSignedPercent } from '@/lib/formatters'
import type { PortfolioSummary } from '../types/investments.types'

defineProps<{ summary: PortfolioSummary }>()
</script>

<template>
  <section class="flex flex-col rounded-3xl bg-white p-6 shadow-sm">
    <div class="flex items-start justify-between">
      <p class="text-sm text-neutral-500">Patrimônio Investido</p>
      <span
        v-if="summary.profitPct !== null"
        class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800"
      >
        <TrendingUp class="size-3" aria-hidden="true" />
        {{ formatSignedPercent(summary.profitPct) }}
      </span>
    </div>

    <p class="mt-3 text-4xl font-semibold tracking-tight text-neutral-900">{{ formatBRL(summary.total) }}</p>

    <div
      v-if="summary.monthYield !== null || summary.twelveMonthsPct !== null"
      class="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-neutral-50 p-4"
    >
      <div v-if="summary.monthYield !== null">
        <p class="text-[11px] uppercase tracking-wider text-neutral-500">Rendimento mês</p>
        <p class="mt-1 text-base font-semibold" :class="summary.monthYield >= 0 ? 'text-emerald-600' : 'text-red-600'">
          {{ formatSignedBRL(summary.monthYield) }}
        </p>
      </div>
      <div v-if="summary.twelveMonthsPct !== null">
        <p class="text-[11px] uppercase tracking-wider text-neutral-500">Rentab. 12 meses</p>
        <p class="mt-1 text-base font-semibold text-neutral-900">{{ formatPercent(summary.twelveMonthsPct) }}</p>
      </div>
    </div>
  </section>
</template>
