<script setup lang="ts">
import { Heart } from 'lucide-vue-next'

defineProps<{ liked: boolean; count: number; busy?: boolean; label?: string }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="liked"
    :aria-label="liked ? 'Remover curtida' : (label ?? 'Curtir')"
    :disabled="busy"
    class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    :class="liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
    @click.stop.prevent="$emit('toggle')"
  >
    <Heart class="size-4" :class="liked ? 'fill-current' : ''" aria-hidden="true" />
    <span class="tabular-nums">{{ count }}</span>
  </button>
</template>
