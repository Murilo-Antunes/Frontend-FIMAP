<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ImageOff, Play } from 'lucide-vue-next'
import type { ConteudoItem } from '../types/community.types'

const props = withDefaults(
  defineProps<{
    items: ConteudoItem[]
    /** Prévia (feed): sem controles, limitada a `limit` itens e com "+N" no último. */
    compact?: boolean
    limit?: number
  }>(),
  { compact: false, limit: 4 },
)

const failed = reactive<Record<number, boolean>>({})

const visible = computed(() => (props.compact ? props.items.slice(0, props.limit) : props.items))
const hidden = computed(() => Math.max(0, props.items.length - visible.value.length))
const single = computed(() => visible.value.length === 1)

/** `#t=0.1` faz o navegador mostrar o primeiro quadro do vídeo na prévia. */
function videoSrc(url: string): string {
  return props.compact ? `${url}#t=0.1` : url
}
</script>

<template>
  <div
    v-if="visible.length"
    class="grid gap-1.5 overflow-hidden rounded-xl"
    :class="single ? 'grid-cols-1' : 'grid-cols-2'"
  >
    <div
      v-for="(item, index) in visible"
      :key="`${index}-${item.valor}`"
      class="relative overflow-hidden bg-muted"
      :class="single ? (compact ? 'aspect-[16/10]' : 'aspect-video') : 'aspect-[4/3]'"
    >
      <div
        v-if="failed[index]"
        class="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
      >
        <ImageOff class="size-5" aria-hidden="true" />
        Mídia indisponível
      </div>

      <template v-else-if="item.tipo === 'foto'">
        <img
          v-if="compact"
          :src="item.valor"
          alt="Foto da publicação"
          class="size-full object-cover"
          loading="lazy"
          decoding="async"
          @error="failed[index] = true"
        />
        <a
          v-else
          :href="item.valor"
          target="_blank"
          rel="noopener noreferrer"
          class="block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Abrir foto em tamanho original"
        >
          <img
            :src="item.valor"
            alt="Foto da publicação"
            class="size-full object-cover"
            loading="lazy"
            decoding="async"
            @error="failed[index] = true"
          />
        </a>
      </template>

      <template v-else>
        <video
          :src="videoSrc(item.valor)"
          :controls="!compact"
          :muted="compact"
          preload="metadata"
          playsinline
          class="size-full bg-black"
          :class="compact ? 'object-cover' : 'object-contain'"
          @error="failed[index] = true"
        />
        <span
          v-if="compact"
          class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
          aria-hidden="true"
        >
          <span class="flex size-10 items-center justify-center rounded-full bg-black/70 text-white">
            <Play class="size-4 translate-x-px fill-current" />
          </span>
        </span>
      </template>

      <span
        v-if="compact && hidden > 0 && index === visible.length - 1"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white"
      >
        +{{ hidden }}
      </span>
    </div>
  </div>
</template>
