<script setup lang="ts">
import { computed } from 'vue'
import { Wallet } from 'lucide-vue-next'
import { formatBRL, formatPercent } from '@/lib/formatters'
import type { Institution } from '../types/accounts.types'

const props = defineProps<{ total: number; institutions: Institution[] }>()

const segments = computed(() =>
  props.institutions.map((i) => {
    const share = props.total > 0 ? (Math.max(0, i.balance) / props.total) * 100 : 0
    return { id: i.itemId, name: i.name, color: i.color, share }
  }),
)

/** "R$ 12.450,30" → ["R$", "12.450,30"] para manter o prefixo menor, como no design. */
const amountParts = computed(() => {
  const [, ...rest] = formatBRL(props.total).split(/\s/)
  return { currency: 'R$', value: rest.join(' ') }
})
</script>

<template>
  <section class="rounded-3xl bg-white p-6 shadow-sm md:p-8">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex size-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
          <Wallet class="size-4" aria-hidden="true" />
        </div>
        <span class="text-xs font-medium uppercase tracking-wider text-neutral-500">Saldo consolidado</span>
      </div>
      <span class="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
        <span class="size-1.5 rounded-full bg-indigo-500" />
        {{ institutions.length }} {{ institutions.length === 1 ? 'ativa' : 'ativas' }}
      </span>
    </div>

    <p class="mt-6 flex items-baseline gap-2 text-neutral-900">
      <span class="text-base text-neutral-400">{{ amountParts.currency }}</span>
      <span class="text-5xl font-medium tracking-tight">{{ amountParts.value }}</span>
    </p>

    <div class="mt-8 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-neutral-100" role="img" aria-label="Distribuição do saldo por instituição">
      <div
        v-for="s in segments"
        :key="s.id"
        class="h-full first:rounded-l-full last:rounded-r-full"
        :style="{ width: `${s.share}%`, backgroundColor: s.color }"
      />
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-700">
      <li v-for="s in segments" :key="s.id" class="flex items-center gap-2">
        <span class="size-2 rounded-full" :style="{ backgroundColor: s.color }" />
        {{ s.name }} {{ formatPercent(s.share) }}
      </li>
    </ul>
  </section>
</template>
