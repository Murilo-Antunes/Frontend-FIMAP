<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'error' | 'success' }>(), { variant: 'error' })
</script>

<template>
  <div
    class="rounded-xl border px-4 py-3 text-sm"
    :class="
      variant === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-green-200 bg-green-50 text-green-700'
    "
    :role="variant === 'error' ? 'alert' : 'status'"
  >
    <slot />
  </div>
</template>
