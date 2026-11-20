<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Lock } from 'lucide-vue-next'
import type { Badge } from '../types/profile.types'

const props = withDefaults(
  defineProps<{
    badge: Badge
    /** Texto do selo no canto (ex.: "100%", "Rara", "Nível Máx"). */
    tag?: string
    /** Texto discreto no rodapé, à esquerda (ex.: "3 conexões ativas" / data). */
    footerLeft?: string
    /** Texto em destaque no rodapé, à direita (ex.: "+150 XP"). */
    footerRight?: string
    /** Badge ainda não conquistada (mostra cadeado e opacidade reduzida). */
    locked?: boolean
    /** 0–100, mostra barra de progresso. Só faz sentido com locked. */
    progress?: number
    /** Mostra um check preenchido no canto (badge já conquistada). */
    checked?: boolean
    /** Card maior, usado na seção de destaque do próprio perfil. */
    size?: 'sm' | 'lg'
  }>(),
  { size: 'sm' },
)

const iconBoxClass = computed(() =>
  props.locked ? 'bg-neutral-100 text-neutral-300' : 'bg-neutral-100 text-foreground',
)
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-border/50"
    :class="[locked ? 'opacity-70' : '', size === 'lg' ? 'min-h-[132px]' : '']"
  >
    <div class="flex items-start justify-between gap-2">
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl"
        :class="iconBoxClass"
      >
        <Lock v-if="locked" :size="18" aria-hidden="true" />
        <span v-else aria-hidden="true">{{ badge.icone }}</span>
      </div>

      <span
        v-if="tag"
        class="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
      >
        {{ tag }}
      </span>
      <CheckCircle2
        v-else-if="checked"
        :size="18"
        class="shrink-0 text-foreground"
        aria-label="Badge conquistada"
      />
    </div>

    <div>
      <p class="text-sm font-semibold leading-tight text-foreground">{{ badge.nome }}</p>
      <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ badge.descricao }}</p>
    </div>

    <div v-if="progress !== undefined" class="space-y-1.5">
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          class="h-full rounded-full bg-foreground transition-[width]"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <p class="text-right text-[11px] text-muted-foreground">{{ progress }}%</p>
    </div>

    <div v-if="footerLeft || footerRight" class="mt-auto flex items-center justify-between gap-2 text-xs">
      <span class="truncate text-muted-foreground">{{ footerLeft }}</span>
      <span v-if="footerRight" class="shrink-0 font-semibold text-foreground">{{ footerRight }}</span>
    </div>
  </div>
</template>
