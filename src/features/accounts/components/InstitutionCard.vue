<script setup lang="ts">
import { computed } from 'vue'
import { Clock } from 'lucide-vue-next'
import { formatBRL, formatRelative, minutesSince } from '@/lib/formatters'
import InstitutionAvatar from './InstitutionAvatar.vue'
import type { Institution } from '../types/accounts.types'

const props = defineProps<{ institution: Institution }>()

const sync = computed(() => {
  const iso = props.institution.updatedAt
  if (!iso) return null
  return minutesSince(iso) < 2
    ? { fresh: true, label: 'Sincronizado agora' }
    : { fresh: false, label: `Sincronizado ${formatRelative(iso)}` }
})
</script>

<template>
  <article class="flex flex-col rounded-3xl bg-white p-6 shadow-sm">
    <div class="flex items-center gap-3">
      <InstitutionAvatar :name="institution.name" :logo-url="institution.logoUrl" />
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-neutral-900">{{ institution.name }}</h3>
        <p v-if="institution.accountLabel" class="truncate text-xs text-neutral-500">{{ institution.accountLabel }}</p>
      </div>
    </div>

    <p class="mt-6 text-xs text-neutral-500">Saldo disponível</p>
    <p class="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{{ formatBRL(institution.balance) }}</p>

    <div v-if="sync" class="mt-5 border-t border-neutral-100 pt-4">
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs"
        :class="sync.fresh ? 'text-neutral-600' : 'text-neutral-500'"
      >
        <span v-if="sync.fresh" class="size-1.5 rounded-full bg-emerald-500" />
        <Clock v-else class="size-3" aria-hidden="true" />
        {{ sync.label }}
      </span>
    </div>
  </article>
</template>
