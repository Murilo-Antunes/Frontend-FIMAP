<script setup lang="ts">
/**
 * Logo da marca. PLACEHOLDER: troque o conteúdo por <img src="@/assets/logo.svg" />
 * quando o arquivo oficial estiver em src/assets/.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 96 })
</script>

<template>
  <div
    class="flex items-center justify-center rounded-full bg-black text-white shadow-md"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    aria-label="Fimap"
  >
    <span class="font-black italic" :style="{ fontSize: `${size * 0.5}px` }">F</span>
  </div>
</template>
