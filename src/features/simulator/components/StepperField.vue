<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'
import { roundMoney } from '../lib/format'
import { LIMITS } from '../schemas/simulator.schemas'
import CurrencyField from './CurrencyField.vue'

const model = defineModel<number>({ required: true })

const props = withDefaults(
  defineProps<{
    label: string
    step?: number
    invalid?: boolean
  }>(),
  { step: 100 },
)

function bump(direction: 1 | -1): void {
  model.value = Math.min(
    Math.max(roundMoney(model.value + direction * props.step), 0),
    LIMITS.moneyMax,
  )
}
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-xl border bg-neutral-50 p-1.5"
    :class="invalid ? 'border-red-500' : 'border-neutral-200'"
  >
    <button
      type="button"
      :aria-label="`Diminuir ${label}`"
      :disabled="model <= 0"
      class="grid size-9 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-40"
      @click="bump(-1)"
    >
      <Minus class="size-4" aria-hidden="true" />
    </button>

    <CurrencyField
      v-model="model"
      :aria-label="label"
      :invalid="invalid"
      class="min-w-0 flex-1 bg-transparent text-center text-sm font-semibold tabular-nums text-neutral-950 outline-none"
    />

    <button
      type="button"
      :aria-label="`Aumentar ${label}`"
      class="grid size-9 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
      @click="bump(1)"
    >
      <Plus class="size-4" aria-hidden="true" />
    </button>
  </div>
</template>
