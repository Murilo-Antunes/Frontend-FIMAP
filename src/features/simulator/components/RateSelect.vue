<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { findRateOption } from '../lib/rate-options'
import type { RateOption } from '../types/simulator.types'

const CUSTOM = '__custom__'

/** Rentabilidade em % a.a. */
const model = defineModel<number | null>({ required: true })

const props = defineProps<{
  options: RateOption[]
  /** Indicadores ainda carregando */
  loading?: boolean
  invalid?: boolean
}>()

const selectId = useId()
const customId = useId()

const matched = computed(() => findRateOption(props.options, model.value))
const customForced = ref(false)

// Taxa salva que não coincide com nenhuma opção (os indicadores mudam) → modo personalizado.
const selected = computed(() => {
  if (customForced.value) return CUSTOM
  if (matched.value) return matched.value.key
  return model.value === null ? '' : CUSTOM
})

watch(matched, (option) => {
  if (option) customForced.value = false
})

function onSelect(event: Event): void {
  const key = (event.target as HTMLSelectElement).value
  if (key === CUSTOM) {
    customForced.value = true
    return
  }
  customForced.value = false
  const option = props.options.find((item) => item.key === key)
  if (option) model.value = option.value
}

function onCustomInput(event: Event): void {
  const text = (event.target as HTMLInputElement).value
  model.value = text === '' ? null : Number(text)
}
</script>

<template>
  <div>
    <div class="relative">
      <select
        :id="selectId"
        :value="selected"
        :disabled="loading"
        :aria-invalid="invalid || undefined"
        class="w-full appearance-none rounded-xl border bg-neutral-50 py-3 pl-4 pr-10 text-sm text-neutral-900 outline-none focus-visible:border-indigo-600 disabled:opacity-60"
        :class="invalid ? 'border-red-500' : 'border-neutral-200'"
        aria-label="Rentabilidade contratada"
        @change="onSelect"
      >
        <option v-if="loading" value="">Carregando indicadores…</option>
        <option v-else-if="selected === ''" value="" disabled>Selecione a rentabilidade</option>
        <option v-for="option in options" :key="option.key" :value="option.key">
          {{ option.label }}
        </option>
        <option :value="CUSTOM">Personalizada…</option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
        aria-hidden="true"
      />
    </div>

    <div v-if="selected === CUSTOM" class="mt-3 flex items-center gap-3">
      <label :for="customId" class="text-xs text-neutral-500">Rentabilidade (% ao ano)</label>
      <input
        :id="customId"
        type="number"
        inputmode="decimal"
        step="0.01"
        :value="model ?? ''"
        class="w-28 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold tabular-nums outline-none focus-visible:border-indigo-600"
        @input="onCustomInput"
      />
    </div>
  </div>
</template>
