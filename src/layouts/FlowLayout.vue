<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

defineProps<{ backLabel?: string }>()

const emit = defineEmits<{
  back: []
}>()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#f8f9fb] text-neutral-900">
    <header class="relative z-20 flex h-16 items-center bg-white shadow-sm">
      <div class="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 lg:px-28">
        <button
          type="button"
          class="rounded-md p-1 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black"
          :aria-label="backLabel ?? 'Voltar'"
          @click="emit('back')"
        >
          <ArrowLeft :size="22" />
        </button>
        <span class="text-xl font-bold">Fimap</span>
      </div>
    </header>

    <main class="flex flex-1 items-center justify-center px-6 py-10">
      <slot />
    </main>
  </div>
</template>
