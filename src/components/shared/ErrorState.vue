<script setup lang="ts">
withDefaults(defineProps<{ title?: string; message?: string }>(), {
  title: 'Algo deu errado',
  message: 'Não foi possível carregar as informações. Tente novamente.',
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="flex flex-col items-center gap-3 rounded-3xl border border-neutral-200 bg-white px-6 py-14 text-center"
    role="alert"
  >
    <h2 class="text-lg font-semibold">{{ title }}</h2>
    <p class="max-w-sm text-sm text-neutral-500">{{ message }}</p>
    <button
      type="button"
      class="mt-2 h-10 rounded-xl bg-black px-5 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      @click="emit('retry')"
    >
      Tentar novamente
    </button>
  </div>
</template>
