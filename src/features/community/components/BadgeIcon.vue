<script setup lang="ts">
import { computed } from 'vue'
import { Award } from 'lucide-vue-next'

const props = defineProps<{ icone?: string | null }>()

const isUrl = computed(() => /^https?:\/\//i.test(props.icone ?? ''))
const text = computed(() => (props.icone ?? '').trim())
</script>

<template>
  <span
    class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
    aria-hidden="true"
  >
    <img v-if="isUrl" :src="text" alt="" class="size-6 object-contain" loading="lazy" decoding="async" />
    <template v-else-if="text">{{ text }}</template>
    <Award v-else class="size-5 text-neutral-400" />
  </span>
</template>
