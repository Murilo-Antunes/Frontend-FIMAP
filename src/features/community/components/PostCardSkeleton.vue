<script setup lang="ts">
import { ui } from '../ui'
</script>

<template>
  <div :class="[ui.card, 'flex h-full min-h-44 animate-pulse flex-col gap-3 p-4']" aria-hidden="true">
    <div class="flex items-center gap-3">
      <div class="size-10 rounded-full bg-[#eeeeee]" />
      <div class="space-y-2">
        <div class="h-3 w-28 rounded bg-[#eeeeee]" />
        <div class="h-2.5 w-20 rounded bg-[#f3f3f3]" />
      </div>
    </div>
    <div class="space-y-2">
      <div class="h-3 w-full rounded bg-[#f3f3f3]" />
      <div class="h-3 w-11/12 rounded bg-[#f3f3f3]" />
      <div class="h-3 w-2/3 rounded bg-[#f3f3f3]" />
    </div>
  </div>
</template>
