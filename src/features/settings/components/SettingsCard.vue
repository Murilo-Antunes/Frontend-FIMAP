<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  icon: Component
}>()
</script>

<template>
  <section class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
    <header class="flex items-center justify-between gap-4 border-b border-neutral-100 pb-4">
      <h2 class="flex items-center gap-3 text-base font-semibold text-neutral-900">
        <component :is="icon" class="size-5" aria-hidden="true" />
        {{ title }}
      </h2>
      <slot name="aside" />
    </header>

    <div class="pt-2">
      <slot />
    </div>
  </section>
</template>
