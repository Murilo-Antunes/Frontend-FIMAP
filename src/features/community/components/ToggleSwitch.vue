<script setup lang="ts">
defineProps<{
  modelValue: boolean
  /** Texto lido por leitores de tela (o switch não tem texto visível). */
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-60"
    :class="modelValue ? 'bg-black' : 'bg-neutral-200'"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="inline-block size-5 rounded-full bg-white shadow transition-transform"
      :class="modelValue ? 'translate-x-[22px]' : 'translate-x-0.5'"
    />
  </button>
</template>
