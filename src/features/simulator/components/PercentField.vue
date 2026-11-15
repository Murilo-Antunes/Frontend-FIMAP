<script setup lang="ts">
/** Taxa em % a.a. Vazio = null (o formulário valida na hora de salvar). */
const model = defineModel<number | null>({ required: true })

defineProps<{
  invalid?: boolean
  placeholder?: string
}>()

function onInput(event: Event): void {
  const text = (event.target as HTMLInputElement).value
  model.value = text === '' ? null : Number(text)
}
</script>

<template>
  <span class="inline-flex items-baseline justify-end gap-1.5">
    <input
      type="number"
      inputmode="decimal"
      step="0.01"
      :placeholder="placeholder"
      :value="model ?? ''"
      :aria-invalid="invalid || undefined"
      class="w-24 bg-transparent text-right text-base font-bold tabular-nums text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-400"
      @input="onInput"
    />
    <span class="text-sm font-semibold text-neutral-950">% a.a.</span>
  </span>
</template>
