<script setup lang="ts">
import { computed } from 'vue'
import { Award } from 'lucide-vue-next'

const props = defineProps<{ icone?: string | null }>()

const isUrl = computed(() => /^https?:\/\//i.test(props.icone ?? ''))
const text = computed(() => (props.icone ?? '').trim())
</script>

<template>
  <span
    class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-lg shadow-sm"
    aria-hidden="true"
  >
    <img v-if="isUrl" :src="text" alt="" class="size-6 object-contain" loading="lazy" decoding="async" />
    <template v-else-if="text">{{ text }}</template>
    <Award v-else class="size-5 text-muted-foreground" />
  </span>
</template>
