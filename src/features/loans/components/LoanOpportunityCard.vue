<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, TrendingDown } from 'lucide-vue-next'
import type { LoanOpportunity } from '../types/loans.types'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    icon?: 'sparkles' | 'trending-down'
    /** 'chip': rótulo com fundo (tela de Histórico) · 'caps': rótulo em caixa alta sem fundo (tela de Empréstimos) */
    eyebrowVariant?: 'chip' | 'caps'
    opportunity: LoanOpportunity
  }>(),
  { icon: 'sparkles', eyebrowVariant: 'chip' },
)

const emit = defineEmits<{
  (e: 'primary-action'): void
  (e: 'secondary-action'): void
}>()

const IconComponent = computed(() => (props.icon === 'trending-down' ? TrendingDown : Sparkles))
</script>

<template>
  <div class="flex h-full flex-col justify-between rounded-2xl bg-neutral-950 p-6 text-white">
    <div>
      <div class="mb-4 flex items-center justify-between gap-3">
        <div
          v-if="eyebrowVariant === 'chip'"
          class="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90"
        >
          <component :is="IconComponent" class="h-3.5 w-3.5" />
          {{ eyebrow }}
        </div>
        <div v-else class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          <component :is="IconComponent" class="h-3.5 w-3.5" />
          {{ eyebrow }}
        </div>

        <span v-if="opportunity.tag" class="text-xs text-white/60">{{ opportunity.tag }}</span>
      </div>

      <p class="text-lg leading-snug">{{ opportunity.titulo }}</p>

      <p v-if="opportunity.descricao" class="mt-3 text-sm leading-relaxed text-white/60">
        {{ opportunity.descricao }}
      </p>

      <div v-if="opportunity.destaque" class="mt-5 flex items-center justify-between rounded-xl bg-white/5 p-3">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold">
            {{ opportunity.destaque.sigla }}
          </div>
          <div>
            <p class="text-sm font-medium">{{ opportunity.destaque.titulo }}</p>
            <p class="text-xs text-white/50">{{ opportunity.destaque.subtitulo }}</p>
          </div>
        </div>
        <p class="text-base font-semibold">{{ opportunity.destaque.valor }}</p>
      </div>
    </div>

    <div class="mt-6 flex gap-3">
      <button
        type="button"
        class="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white/90"
        @click="emit('primary-action')"
      >
        {{ opportunity.primaryActionLabel }}
      </button>
      <button
        v-if="opportunity.secondaryActionLabel"
        type="button"
        class="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
        @click="emit('secondary-action')"
      >
        {{ opportunity.secondaryActionLabel }}
      </button>
    </div>
  </div>
</template>
