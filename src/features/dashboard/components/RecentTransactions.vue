<script setup lang="ts">
import type { Component } from 'vue'
import { ArrowDown, Banknote, ListFilter, ShoppingBag, Utensils } from 'lucide-vue-next'
import { useHiddenValues } from '@/composables/useHiddenValues'
import { formatTransactionDate } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import type { DashboardTransaction } from '../types/dashboard.types'

defineProps<{ transactions: DashboardTransaction[] }>()

const CATEGORY_ICONS: Record<string, Component> = {
  Tecnologia: ShoppingBag,
  Gastronomia: Utensils,
}

const { mask } = useHiddenValues()

const iconFor = (transaction: DashboardTransaction): Component =>
  transaction.tipo === 'receita' ? ArrowDown : (CATEGORY_ICONS[transaction.categoria] ?? Banknote)

function amountLabel(transaction: DashboardTransaction): string {
  const sign = transaction.tipo === 'receita' ? '+' : '-'
  return `${sign} ${mask(formatCurrency(transaction.valor))}`
}
</script>

<template>
  <section class="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
    <header class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Últimas Transações</h2>
        <p class="text-xs text-neutral-500">Tempo real via Open Banking</p>
      </div>
      <!-- Sem ação ainda: filtros virão com a tela de transações -->
      <button
        type="button"
        class="rounded-full bg-neutral-100 p-3 text-neutral-700 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-black"
        aria-label="Filtrar transações"
      >
        <ListFilter :size="18" />
      </button>
    </header>

    <p v-if="transactions.length === 0" class="mt-8 text-center text-sm text-neutral-500">
      Nenhuma transação encontrada.
    </p>

    <ul v-else class="mt-4 divide-y divide-neutral-100 border-t border-neutral-100">
      <li v-for="transaction in transactions" :key="transaction.id" class="flex items-center gap-4 py-4">
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-full"
          :class="transaction.tipo === 'receita' ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-700'"
        >
          <component :is="iconFor(transaction)" :size="18" aria-hidden="true" />
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ transaction.descricao }}</p>
          <p class="truncate text-xs text-neutral-500">
            {{ formatTransactionDate(transaction.data) }}<template v-if="transaction.conta"> • {{ transaction.conta }}</template>
          </p>
        </div>

        <p class="shrink-0 text-sm font-medium">{{ amountLabel(transaction) }}</p>

        <span
          class="hidden w-28 shrink-0 rounded-full px-3 py-1 text-center text-xs font-medium sm:block"
          :class="transaction.tipo === 'receita' ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-500'"
        >
          {{ transaction.categoria }}
        </span>
      </li>
    </ul>
  </section>
</template>
