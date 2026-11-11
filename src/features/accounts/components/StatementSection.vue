<script setup lang="ts">
import { computed, ref } from 'vue'
import { Banknote, Coffee, Receipt, ShoppingBag, Zap } from 'lucide-vue-next'
import type { Component } from 'vue'
import { formatSignedBRL, formatStatementDate } from '@/lib/formatters'
import type { Institution, StatementEntry, StatementIcon } from '../types/accounts.types'

const props = defineProps<{ entries: StatementEntry[]; institutions: Institution[] }>()

const COLLAPSED_COUNT = 6
const MAX_EXPANDED = 200

const ICONS: Record<StatementIcon, Component> = {
  shopping: ShoppingBag,
  'transfer-in': Banknote,
  utilities: Zap,
  food: Coffee,
  generic: Receipt,
}

const selected = ref<string | null>(null) // itemId ou null = todos
const expanded = ref(false)

const filtered = computed(() =>
  selected.value ? props.entries.filter((e) => e.institutionId === selected.value) : props.entries,
)
const visible = computed(() => filtered.value.slice(0, expanded.value ? MAX_EXPANDED : COLLAPSED_COUNT))
const canExpand = computed(() => filtered.value.length > COLLAPSED_COUNT)

function select(itemId: string | null): void {
  selected.value = itemId
  expanded.value = false
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-neutral-900">Extrato Consolidado</h2>
      <button
        v-if="canExpand"
        type="button"
        class="text-sm text-neutral-500 transition hover:text-neutral-900"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Ver menos' : 'Ver todos' }}
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por instituição">
      <button
        type="button"
        role="tab"
        :aria-selected="selected === null"
        class="rounded-full px-4 py-1.5 text-xs font-medium transition"
        :class="selected === null ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'"
        @click="select(null)"
      >
        Todos
      </button>
      <button
        v-for="i in institutions"
        :key="i.itemId"
        type="button"
        role="tab"
        :aria-selected="selected === i.itemId"
        class="rounded-full px-4 py-1.5 text-xs font-medium transition"
        :class="selected === i.itemId ? 'bg-black text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100'"
        @click="select(i.itemId)"
      >
        {{ i.name }}
      </button>
    </div>

    <div class="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">
      <p v-if="visible.length === 0" class="p-8 text-center text-sm text-neutral-500">
        Nenhuma movimentação encontrada para este filtro.
      </p>
      <ul v-else class="divide-y divide-neutral-100">
        <li v-for="entry in visible" :key="entry.id" class="flex items-center gap-4 px-6 py-5">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl"
            :class="entry.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-700'"
          >
            <component :is="ICONS[entry.icon]" class="size-4" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-sm font-medium text-neutral-900">{{ entry.description }}</p>
              <span class="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">{{ entry.institutionName }}</span>
            </div>
            <p class="mt-1 text-xs text-neutral-500">{{ formatStatementDate(entry.date) }}</p>
          </div>
          <p
            class="shrink-0 text-base font-semibold tabular-nums"
            :class="entry.amount > 0 ? 'text-emerald-600' : 'text-neutral-900'"
          >
            {{ formatSignedBRL(entry.amount, true) }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>
