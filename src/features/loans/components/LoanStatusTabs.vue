<script setup lang="ts">
export type LoanStatusTab = 'todas' | 'pendentes' | 'pagas' | 'amortizadas'

defineProps<{
  modelValue: LoanStatusTab
  counts: Record<LoanStatusTab, number>
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: LoanStatusTab): void }>()

const tabs: { key: LoanStatusTab; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'pagas', label: 'Pagas' },
  { key: 'amortizadas', label: 'Amortizadas' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="rounded-full px-4 py-2 text-sm font-medium transition"
      :class="modelValue === tab.key ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }} ({{ counts[tab.key] }})
    </button>
  </div>
</template>
