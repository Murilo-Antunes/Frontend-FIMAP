<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ name: string; logoUrl: string | null }>()

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : props.name.slice(0, 2)
  return letters.toUpperCase()
})
</script>

<template>
  <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-800">
    <img v-if="logoUrl" :src="logoUrl" :alt="name" class="size-full object-cover" />
    <span v-else>{{ initials }}</span>
  </div>
</template>
