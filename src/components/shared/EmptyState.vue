<script setup lang="ts">
defineProps<{ title: string; description?: string; actionLabel?: string }>()
defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="rounded-2xl bg-white p-10 text-center shadow-sm">
    <p class="text-base font-medium text-neutral-900">{{ title }}</p>
    <p v-if="description" class="mx-auto mt-1 max-w-md text-sm text-neutral-500">{{ description }}</p>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-5 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
