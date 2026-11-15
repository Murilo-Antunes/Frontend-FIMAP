<script setup lang="ts">
import type { SimulationKind } from '../types/simulator.types'

const model = defineModel<SimulationKind>({ required: true })

defineProps<{
  /** Bloqueia a troca (ex.: ao editar uma simulação já salva, o tipo não muda). */
  disabled?: boolean
  disabledHint?: string
}>()

const tabs: { value: SimulationKind; label: string }[] = [
  { value: 'investimentos', label: 'Investimentos' },
  { value: 'amortizacoes', label: 'Amortização' },
]
</script>

<template>
  <div
    role="group"
    aria-label="Tipo de simulação"
    class="inline-flex rounded-full bg-neutral-200/60 p-1"
    :title="disabled ? disabledHint : undefined"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      :aria-pressed="model === tab.value"
      :disabled="disabled && model !== tab.value"
      class="rounded-full px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
      :class="
        model === tab.value
          ? 'bg-white text-neutral-950 shadow-sm'
          : 'text-neutral-500 hover:text-neutral-800'
      "
      @click="model = tab.value"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
