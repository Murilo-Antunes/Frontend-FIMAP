<script setup lang="ts">
import { computed } from 'vue'
import type { GastoCategoria, StatusRecurso } from '../types/cards.types'
import { corDaCategoria } from '../utils/category-colors'
import { formatarMoedaEnxuta, formatarPercentual, percentual } from '../utils/format'
import CardsErrorState from './CardsErrorState.vue'

const props = defineProps<{
  categorias: GastoCategoria[]
  status: StatusRecurso
  erro: string | null
}>()

defineEmits<{ tentar: [] }>()

const carregando = computed(
  () => props.status === 'idle' || props.status === 'carregando' || props.status === 'sincronizando',
)

const fatias = computed(() => {
  const total = props.categorias.reduce((soma, c) => soma + c.valor, 0)
  return [...props.categorias]
    .sort((a, b) => b.valor - a.valor)
    .map((c, indice) => ({
      ...c,
      cor: corDaCategoria(indice),
      percentual: percentual(c.valor, total),
    }))
})
</script>

<template>
  <section class="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6" aria-labelledby="gastos-titulo">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h2 id="gastos-titulo" class="text-xl font-semibold tracking-tight text-neutral-900">
          Gastos por Categoria
        </h2>
        <p class="mt-1 text-xs text-neutral-500">Distribuição do mês atual</p>
      </div>
      <span class="rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700">Fatura Atual</span>
    </header>

    <div v-if="carregando" class="mt-5" aria-busy="true">
      <div class="animate-pulse space-y-3">
        <div class="h-2 rounded-full bg-neutral-100" />
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="n in 4" :key="n" class="h-14 rounded-xl bg-neutral-100" />
        </div>
      </div>
      <p v-if="status === 'sincronizando'" class="mt-3 text-xs text-neutral-400" role="status">
        Sincronizando com o banco…
      </p>
    </div>

    <CardsErrorState v-else-if="status === 'erro'" compacto :mensagem="erro" @tentar="$emit('tentar')" />

    <p v-else-if="fatias.length === 0" class="py-8 text-center text-sm text-neutral-500">
      Ainda não há gastos nesta fatura.
    </p>

    <template v-else>
      <div
        class="mt-5 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-neutral-100"
        role="img"
        :aria-label="fatias.map((f) => `${f.nome} ${formatarPercentual(f.percentual)}`).join(', ')"
      >
        <div
          v-for="fatia in fatias"
          :key="fatia.categoriaId"
          class="h-full transition-[width] duration-700 ease-out"
          :style="{ width: `${fatia.percentual}%`, backgroundColor: fatia.cor }"
        />
      </div>

      <ul class="mt-4 grid gap-3 sm:grid-cols-2">
        <li
          v-for="fatia in fatias"
          :key="fatia.categoriaId"
          class="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3"
        >
          <span class="size-2.5 flex-none rounded-full" :style="{ backgroundColor: fatia.cor }" aria-hidden="true" />
          <div class="min-w-0">
            <p class="truncate text-xs text-neutral-500">{{ fatia.nome }}</p>
            <p class="text-sm font-semibold text-neutral-900">
              {{ formatarPercentual(fatia.percentual) }}
              <span class="text-xs font-normal text-neutral-400">({{ formatarMoedaEnxuta(fatia.valor) }})</span>
            </p>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>
