<script setup lang="ts">
import type { PrazoMeta } from '../types/metas.types'

defineProps<{
  modelValue: PrazoMeta | 'todas'
  total: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: PrazoMeta | 'todas'] }>()

const opcoes: { valor: PrazoMeta | 'todas'; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'curto', label: 'Curto Prazo' },
  { valor: 'medio', label: 'Médio Prazo' },
  { valor: 'longo', label: 'Longo Prazo' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="opcao in opcoes"
      :key="opcao.valor"
      type="button"
      class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
      :class="
        modelValue === opcao.valor
          ? 'bg-black text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      "
      @click="emit('update:modelValue', opcao.valor)"
    >
      {{ opcao.label }}<template v-if="opcao.valor === 'todas'"> ({{ total }})</template>
    </button>
  </div>
</template>
