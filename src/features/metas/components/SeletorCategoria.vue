<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import type { CategoriaMeta } from '../types/metas.types'
import { getIconePorCategoria } from '../utils/metas.utils'
import { CATEGORIA_NOVA } from '../schemas/metas.schemas'

const props = defineProps<{
  categorias: CategoriaMeta[]
  modelValue: number | typeof CATEGORIA_NOVA | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | typeof CATEGORIA_NOVA]
}>()

// Tile fixo de "Personalizado" sempre por último, além das categorias que vierem da API.
const tiles = computed(() => [
  ...props.categorias.map((categoria) => ({
    valor: categoria.id as number | typeof CATEGORIA_NOVA,
    nome: categoria.nome,
    icone: getIconePorCategoria(categoria.nome),
  })),
  { valor: CATEGORIA_NOVA, nome: 'Personalizado', icone: Star },
])
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-gray-900">Selecione uma Categoria</span>
      <span class="text-xs text-gray-400">{{ categorias.length }} categorias disponíveis</span>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="tile in tiles"
        :key="String(tile.valor)"
        type="button"
        class="flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-5 transition-colors"
        :class="
          modelValue === tile.valor
            ? 'bg-black border-black text-white'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
        "
        @click="emit('update:modelValue', tile.valor)"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full"
          :class="modelValue === tile.valor ? 'bg-white/10' : 'bg-gray-100'"
        >
          <component :is="tile.icone" class="h-5 w-5" :stroke-width="1.75" />
        </span>
        <span class="text-sm text-center leading-tight">{{ tile.nome }}</span>
      </button>
    </div>
  </div>
</template>
