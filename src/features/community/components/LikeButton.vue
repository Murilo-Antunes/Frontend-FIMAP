<script setup lang="ts">
import { Heart } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    liked: boolean
    count: number
    busy?: boolean
    /** `count`: ícone + número (feed e comentários). `label`: "Curtir"/"Curtido" (tela do post). */
    variant?: 'count' | 'label'
  }>(),
  { busy: false, variant: 'count' },
)
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="liked"
    :aria-label="liked ? 'Remover curtida' : 'Curtir'"
    :disabled="busy"
    class="inline-flex items-center gap-1.5 rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-black/30 disabled:opacity-60"
    :class="
      variant === 'label'
        ? 'text-sm font-semibold text-neutral-900 hover:opacity-80'
        : 'text-xs text-neutral-500 hover:text-neutral-800'
    "
    @click.stop.prevent="$emit('toggle')"
  >
    <Heart
      :class="[variant === 'label' ? 'size-[18px]' : 'size-4', liked ? 'fill-red-500 text-red-500' : '']"
      aria-hidden="true"
    />
    <span v-if="variant === 'label'">{{ liked ? 'Curtido' : 'Curtir' }}</span>
    <span v-else class="tabular-nums">{{ count }}</span>
  </button>
</template>
