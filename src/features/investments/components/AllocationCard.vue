<script setup lang="ts">
import { formatBRL, formatPercent } from '@/lib/formatters'
import type { AssetClassGroup } from '../types/investments.types'

defineProps<{ groups: AssetClassGroup[] }>()
</script>

<template>
  <section class="rounded-3xl bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-neutral-900">Alocação da Carteira</h2>
      <span class="text-sm text-neutral-500">{{ groups.length }} {{ groups.length === 1 ? 'Classe' : 'Classes' }}</span>
    </div>

    <div class="mt-4 flex h-2 w-full gap-1 overflow-hidden rounded-full bg-neutral-100" role="img" aria-label="Alocação por classe de ativo">
      <div v-for="g in groups" :key="g.key" class="h-full rounded-full" :style="{ width: `${g.pct}%`, backgroundColor: g.color }" />
    </div>

    <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="g in groups" :key="g.key" class="rounded-2xl bg-neutral-50 p-4">
        <p class="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <span class="size-2.5 rounded-full" :style="{ backgroundColor: g.color }" />
          {{ g.label }} {{ formatPercent(g.pct, 0) }}
        </p>
        <p class="mt-2 truncate text-xs text-neutral-500">{{ g.examples }}</p>
        <p class="mt-1 text-lg font-semibold text-neutral-900">{{ formatBRL(g.total) }}</p>
      </article>
    </div>
  </section>
</template>
