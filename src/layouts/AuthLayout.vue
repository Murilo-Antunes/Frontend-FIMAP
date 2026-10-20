<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import BrandLogo from '@/components/shared/BrandLogo.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle: string
    /** split: marca à esquerda e formulário à direita (desktop). stacked: tudo centralizado. */
    variant?: 'split' | 'stacked'
    /** Barra superior com seta de voltar (telas de recuperação de acesso). */
    showHeader?: boolean
    /** Círculos decorativos do canto superior esquerdo. */
    decor?: boolean
    backTo?: string
  }>(),
  { variant: 'split', showHeader: false, decor: true, backTo: '/login' },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#f8f9fb] text-neutral-900">
    <header v-if="showHeader" class="relative z-20 flex h-16 items-center bg-white shadow-sm">
      <div class="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 lg:px-28">
        <RouterLink
          :to="backTo"
          class="rounded-md p-1 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black"
          aria-label="Voltar"
        >
          <ArrowLeft :size="22" />
        </RouterLink>
        <span class="text-xl font-bold">Fimap</span>
      </div>
    </header>

    <main class="relative flex flex-1 overflow-hidden">
      <template v-if="decor">
        <div
          class="pointer-events-none absolute left-0 top-0 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9d9d9] lg:size-[656px]"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute left-0 top-0 size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#464646] lg:size-[540px]"
          aria-hidden="true"
        />
      </template>

      <div
        class="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-6 py-10"
        :class="variant === 'split' ? 'lg:flex-row lg:gap-0' : ''"
      >
        <div
          class="flex flex-col items-center text-center"
          :class="variant === 'split' ? 'lg:flex-1' : ''"
        >
          <BrandLogo />
          <h1 class="mt-6 text-2xl font-bold">{{ title }}</h1>
          <p class="mt-2 max-w-xs text-sm text-neutral-600">{{ subtitle }}</p>
        </div>

        <div
          class="flex w-full justify-center"
          :class="variant === 'split' ? 'lg:flex-1' : ''"
        >
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
