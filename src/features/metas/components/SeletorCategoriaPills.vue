<script setup lang="ts">
import type { CategoriaMeta } from '../types/metas.types'
import { getIconePorCategoria } from '../utils/metas.utils'

defineProps<{
  categorias: CategoriaMeta[]
  modelValue: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>

<template>
  <div>
    <span class="text-xs font-medium text-gray-400 tracking-wide">CATEGORIA DO OBJETIVO</span>
    <div class="flex flex-wrap gap-2 mt-2">
      <button
        v-for="categoria in categorias"
        :key="categoria.id"
        type="button"
        class="flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
        :class="
          modelValue === categoria.id
            ? 'bg-black border-black text-white'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        "
        @click="emit('update:modelValue', categoria.id)"
      >
        <component :is="getIconePorCategoria(categoria.nome)" class="h-4 w-4" :stroke-width="1.75" />
        {{ categoria.nome }}
      </button>
    </div>
  </div>
</template>
