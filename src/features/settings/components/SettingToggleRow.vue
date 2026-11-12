<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
  modelValue: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function onToggle(): void {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="flex items-center justify-between gap-6 py-4">
    <div class="min-w-0">
      <p class="text-sm font-medium text-neutral-900">{{ title }}</p>
      <p class="mt-0.5 text-xs text-neutral-500">{{ description }}</p>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="title"
      :disabled="disabled"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-wait disabled:opacity-60"
      :class="modelValue ? 'bg-neutral-950' : 'bg-neutral-300'"
      @click="onToggle"
    >
      <span
        class="pointer-events-none block size-5 rounded-full bg-white shadow transition-transform"
        :class="modelValue ? 'translate-x-[22px]' : 'translate-x-0.5'"
      />
    </button>
  </div>
</template>
