<script setup lang="ts">
import { ArrowDownRight, ArrowUpRight, Ellipsis } from 'lucide-vue-next'
import { useHiddenValues } from '@/composables/useHiddenValues'
import { formatNumber, formatPercent, formatSignedCurrency } from '@/lib/format'
import type { DashboardSummary } from '../types/dashboard.types'

defineProps<{ patrimonio: DashboardSummary['patrimonio'] }>()

const { mask } = useHiddenValues()
</script>

<template>
  <article class="flex min-h-64 flex-col justify-between rounded-3xl bg-neutral-950 p-6 text-white">
    <div>
      <header class="flex items-center justify-between">
        <h3 class="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
          Patrimônio consolidado
        </h3>
        <button
          type="button"
          class="rounded-lg p-1 text-neutral-400 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Mais opções"
        >
          <Ellipsis :size="18" />
        </button>
      </header>

      <p class="mt-4 flex items-start gap-1.5">
        <span class="mt-2 text-xl text-neutral-400">R$</span>
        <span class="text-5xl font-semibold tracking-tight sm:text-6xl">
          {{ mask(formatNumber(patrimonio.total)) }}
        </span>
      </p>
    </div>

    <footer
      class="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-sm"
    >
      <p class="flex items-center gap-2">
        <span class="flex size-5 items-center justify-center rounded-md bg-white/15">
          <ArrowDownRight v-if="patrimonio.variacao_mes < 0" :size="12" aria-hidden="true" />
          <ArrowUpRight v-else :size="12" aria-hidden="true" />
        </span>
        <span>
          {{ mask(formatSignedCurrency(patrimonio.variacao_mes)) }}
          <template v-if="patrimonio.variacao_mes_percentual !== null">
            ({{ formatPercent(patrimonio.variacao_mes_percentual, { signed: true }) }})
          </template>
          este mês
        </span>
      </p>
      <p class="text-neutral-400">
        {{ patrimonio.contas_ativas }} {{ patrimonio.contas_ativas === 1 ? 'conta ativa' : 'contas ativas' }}
      </p>
    </footer>
  </article>
</template>
