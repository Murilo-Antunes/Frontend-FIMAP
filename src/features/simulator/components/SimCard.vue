<script setup lang="ts">
defineProps<{
  /** Título em caixa alta pequena (ex.: "PARÂMETROS DO PLANO") */
  eyebrow?: string
}>()
</script>

<template>
  <section
    class="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
  >
    <h2
      v-if="eyebrow"
      class="mb-5 text-xs font-semibold uppercase tracking-wider text-neutral-900"
    >
      {{ eyebrow }}
    </h2>
    <slot />
  </section>
</template>
