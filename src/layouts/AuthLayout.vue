<script setup lang="ts">
import BrandLogo from '@/components/shared/BrandLogo.vue'
import TopographicBackground from '@/components/shared/TopographicBackground.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle: string
    /** split: marca à esquerda e formulário à direita (desktop). stacked: tudo centralizado. */
    variant?: 'split' | 'stacked'
    /** Barra superior com seta de voltar (telas de recuperação de acesso). */
    /** Círculos decorativos do canto superior esquerdo. */
    backTo?: string
  }>(),
  { variant: 'split', showHeader: false, decor: false, backTo: '/login' },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#f8f9fb] text-neutral-900">
    <main class="relative flex flex-1 overflow-hidden">
      <TopographicBackground
        line-color="#E4E4E7"  
        background-color="#FAFAFA"
        :line-opacity = "0.7"
        :line-width="2"
        :intensity="8"
      />
      <template>
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
