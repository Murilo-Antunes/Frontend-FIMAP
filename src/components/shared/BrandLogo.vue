<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 96 })
</script>
<template>
  <div
    class="flex items-center justify-center rounded-full bg-black text-white shadow-md"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    aria-label="Fimap"
  >
    <img src="@/assets/logo.png" />
  </div>
</template>
