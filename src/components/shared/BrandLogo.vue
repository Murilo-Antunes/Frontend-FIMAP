<script setup lang="ts">
/**
 * Logo da marca. PLACEHOLDER: troque o conteúdo por <img src="@/assets/logo.svg" />
 * quando o arquivo oficial estiver em src/assets/.
 */
withDefaults(defineProps<{ size?: number; shape?: "circle" | "rounded" }>(), {
  size: 96,
  shape: "circle",
});
</script>

<template>
  <div
    class="flex items-center justify-center bg-black text-white"
    :class="shape === 'circle' ? 'rounded-full shadow-md' : 'rounded-lg'"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    aria-label="Fimap"
  >
    <img src="@/assets/logo.png" />
  </div>
</template>
