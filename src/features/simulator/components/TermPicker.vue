<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { LIMITS } from '../schemas/simulator.schemas'
import type { TermOption } from '../types/simulator.types'

/** Prazo em MESES. */
const model = defineModel<number>({ required: true })

const props = defineProps<{
  options: TermOption[]
  invalid?: boolean
}>()

const customId = useId()
const matchesPreset = computed(() => props.options.some((option) => option.months === model.value))
const customOpen = ref(!matchesPreset.value)

// Um prazo carregado de uma simulação salva (ex.: 84 meses) abre o campo personalizado.
watch(matchesPreset, (matches) => {
  if (!matches) customOpen.value = true
})

function onCustomInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) model.value = Math.trunc(value)
}
</script>

<template>
  <div>
    <div role="group" aria-label="Prazo" class="grid grid-flow-col auto-cols-fr gap-2">
      <button
        v-for="option in options"
        :key="option.months"
        type="button"
        :aria-pressed="model === option.months"
        class="rounded-xl px-2 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        :class="
          model === option.months
            ? 'bg-neutral-950 text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        "
        @click="model = option.months"
      >
        {{ option.label }}
      </button>
      <button
        type="button"
        aria-label="Prazo personalizado"
        :aria-pressed="customOpen && !matchesPreset"
        class="rounded-xl px-2 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        :class="
          customOpen && !matchesPreset
            ? 'bg-neutral-950 text-white'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        "
        @click="customOpen = !customOpen"
      >
        ···
      </button>
    </div>

    <div v-if="customOpen" class="mt-3 flex items-center gap-3">
      <label :for="customId" class="text-xs text-neutral-500">Prazo personalizado (meses)</label>
      <input
        :id="customId"
        type="number"
        inputmode="numeric"
        :min="LIMITS.prazoMinMeses"
        :max="LIMITS.prazoMaxMeses"
        step="1"
        :value="model"
        :aria-invalid="invalid || undefined"
        class="w-28 rounded-lg border bg-neutral-50 px-3 py-2 text-sm font-semibold tabular-nums outline-none focus-visible:border-indigo-600"
        :class="invalid ? 'border-red-500' : 'border-neutral-200'"
        @input="onCustomInput"
      />
    </div>
  </div>
</template>
