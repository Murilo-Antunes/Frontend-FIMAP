<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { CATEGORIA_TODAS } from '../utils/statement'

defineProps<{ categorias: string[] }>()

const busca = defineModel<string>('busca', { required: true })
const categoria = defineModel<string>('categoria', { required: true })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="relative">
      <label for="busca-extrato" class="sr-only">Buscar lançamento, loja ou valor</label>
      <Search
        class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
        aria-hidden="true"
      />
      <input
        id="busca-extrato"
        v-model="busca"
        type="search"
        autocomplete="off"
        placeholder="Buscar lançamento, loja ou valor..."
        class="h-[43px] w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
      />
    </div>

    <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
      <button
        type="button"
        class="rounded-full px-4 py-1.5 text-xs font-medium transition"
        :class="
          categoria === CATEGORIA_TODAS
            ? 'bg-neutral-950 text-white'
            : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
        "
        :aria-pressed="categoria === CATEGORIA_TODAS"
        @click="categoria = CATEGORIA_TODAS"
      >
        Todos
      </button>
      <button
        v-for="item in categorias"
        :key="item"
        type="button"
        class="rounded-full px-4 py-1.5 text-xs font-medium transition"
        :class="
          categoria === item
            ? 'bg-neutral-950 text-white'
            : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
        "
        :aria-pressed="categoria === item"
        @click="categoria = item"
      >
        {{ item }}
      </button>
    </div>
  </div>
</template>
