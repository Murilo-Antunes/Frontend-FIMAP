<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getInitials } from '../utils/format'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { src: null, name: null, size: 'md' },
)

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-24 text-2xl',
} as const

const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)

const showImage = computed(() => Boolean(props.src) && !failed.value)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 font-semibold text-neutral-500"
    :class="SIZES[size]"
  >
    <img
      v-if="showImage"
      :src="src ?? undefined"
      :alt="name ? `Foto de ${name}` : 'Foto de perfil'"
      class="size-full object-cover"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ getInitials(name) }}</span>
  </span>
</template>
