<script setup lang="ts">
withDefaults(
  defineProps<{
    mensagem?: string | null
    compacto?: boolean
  }>(),
  { mensagem: null, compacto: false },
)

defineEmits<{ tentar: [] }>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 text-center"
    :class="compacto ? 'px-4 py-8' : 'px-6 py-16'"
    role="alert"
  >
    <p class="text-sm font-medium text-neutral-900">Não foi possível carregar.</p>
    <p v-if="mensagem" class="max-w-sm text-xs text-neutral-500">{{ mensagem }}</p>
    <button
      type="button"
      class="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-700"
      @click="$emit('tentar')"
    >
      Tentar novamente
    </button>
  </div>
</template>
