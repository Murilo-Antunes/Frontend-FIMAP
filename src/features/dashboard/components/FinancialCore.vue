<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight, CreditCard, HandCoins, Landmark, TrendingUp } from 'lucide-vue-next'
import { useHiddenValues } from '@/composables/useHiddenValues'
import { formatCurrency } from '@/lib/format'
import type { CoreItem, CoreItemType } from '../types/dashboard.types'

defineProps<{ items: CoreItem[] }>()

const ICONS: Record<CoreItemType, Component> = {
  cartoes: CreditCard,
  contas: Landmark,
  carteira: TrendingUp,
  emprestimos: HandCoins,
}

const { mask } = useHiddenValues()
</script>

<template>
  <section class="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm">
    <header class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Núcleo Financeiro</h2>
      <!-- Sem rota ainda: será a lista completa de produtos financeiros -->
      <button
        type="button"
        class="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-black"
      >
        Ver todos <ChevronRight :size="14" aria-hidden="true" />
      </button>
    </header>

    <p v-if="items.length === 0" class="mt-6 text-sm text-neutral-500">
      Conecte uma instituição financeira para ver seus produtos aqui.
    </p>

    <ul v-else class="mt-5 flex flex-col gap-3">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white"
        >
          <component :is="ICONS[item.tipo]" :size="18" aria-hidden="true" />
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ item.titulo }}</p>
          <p class="truncate text-xs text-neutral-500">{{ item.descricao }}</p>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-sm font-semibold">
            <template v-if="item.valor !== null">
              {{ mask(formatCurrency(item.valor)) }}{{ item.valorSufixo ?? '' }}
            </template>
            <template v-else>—</template>
          </p>
          <p
            class="text-[11px]"
            :class="item.detalheTom === 'positivo' ? 'font-semibold text-green-600' : 'text-neutral-400'"
          >
            {{ item.detalhe }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
