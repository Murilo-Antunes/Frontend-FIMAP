<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

defineProps<{ loading?: boolean; disabled?: boolean }>()
</script>

<template>
  <button
    type="submit"
    class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-6 text-base font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
    :disabled="loading || disabled"
    :aria-busy="loading"
  >
    <Loader2 v-if="loading" class="animate-spin" :size="18" aria-hidden="true" />
    <slot />
  </button>
</template>
