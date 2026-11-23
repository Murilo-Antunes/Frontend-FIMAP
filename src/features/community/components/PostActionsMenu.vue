<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { Flag, MoreHorizontal } from 'lucide-vue-next'

const props = defineProps<{ postId: number }>()

const router = useRouter()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

onClickOutside(rootRef, () => {
  open.value = false
})

function report(): void {
  open.value = false
  void router.push({ name: 'community-report', params: { tipo: 'post', id: props.postId } })
}
</script>

<template>
  <!-- @click.stop: clicar no menu nunca abre o post (o card inteiro é clicável) -->
  <div ref="rootRef" class="relative z-20 shrink-0" @click.stop @keydown.esc="open = false">
    <button
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Mais opções da publicação"
      class="rounded-full p-1.5 text-neutral-400 outline-none transition hover:bg-[#f3f3f3] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-black/30"
      @click.stop.prevent="open = !open"
    >
      <MoreHorizontal class="size-5" aria-hidden="true" />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white p-1 shadow-[0_2px_6px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.12)]"
    >
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-bold text-neutral-900 outline-none transition hover:bg-[#f3f3f3] focus-visible:bg-[#f3f3f3]"
        @click.stop.prevent="report"
      >
        <Flag class="size-4" aria-hidden="true" />
        Denunciar
      </button>
    </div>
  </div>
</template>
