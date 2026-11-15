<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { formatBRL, parseDecimalBR } from '../lib/format'
import { LIMITS } from '../schemas/simulator.schemas'

const model = defineModel<number>({ required: true })

const props = defineProps<{
  max?: number
  invalid?: boolean
}>()

const focused = ref(false)
const draft = ref('')

const display = computed(() => (focused.value ? draft.value : formatBRL(model.value)))

function onFocus(event: FocusEvent): void {
  focused.value = true
  draft.value = model.value ? String(model.value).replace('.', ',') : ''
  const input = event.target as HTMLInputElement
  void nextTick(() => input.select())
}

function onInput(event: Event): void {
  draft.value = (event.target as HTMLInputElement).value
  const parsed = parseDecimalBR(draft.value)
  if (parsed !== null) model.value = Math.min(Math.max(parsed, 0), props.max ?? LIMITS.moneyMax)
}
</script>

<template>
  <input
    type="text"
    inputmode="decimal"
    autocomplete="off"
    :value="display"
    :aria-invalid="invalid || undefined"
    @focus="onFocus"
    @input="onInput"
    @blur="focused = false"
  />
</template>
