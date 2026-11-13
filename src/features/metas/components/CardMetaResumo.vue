<script setup lang="ts">
import { computed } from 'vue'
import type { CategoriaMeta, Meta } from '../types/metas.types'
import {
  LABEL_PRAZO,
  classificarPrazo,
  formatarMoeda,
  getIconePorCategoria,
  mesesRestantes,
  percentualProgresso,
} from '../utils/metas.utils'

const props = defineProps<{
  meta: Meta
  categoria: CategoriaMeta | undefined
}>()

defineEmits<{ abrir: [] }>()

const prazo = computed(() => classificarPrazo(props.meta.dataAlvo))
const percentual = computed(() => percentualProgresso(props.meta))
const meses = computed(() => mesesRestantes(props.meta.dataAlvo))
const pausada = computed(() => props.meta.status === 0)
const icone = computed(() => getIconePorCategoria(props.categoria?.nome ?? ''))
</script>

<template>
  <button
    type="button"
    class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-sm"
    :class="{ 'opacity-60': pausada }"
    @click="$emit('abrir')"
  >
    <div class="flex items-start justify-between">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
        <component :is="icone" class="h-5 w-5 text-gray-700" :stroke-width="1.75" />
      </span>
      <div class="flex gap-1.5">
        <span
          v-if="pausada"
          class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
        >
          Pausada
        </span>
        <span
          v-else-if="prazo !== 'curto'"
          class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
        >
          {{ LABEL_PRAZO[prazo] }}
        </span>
      </div>
    </div>

    <h3 class="mt-3 text-base font-semibold text-gray-900">{{ meta.nome }}</h3>
    <p class="text-xs text-gray-400">Alvo: {{ formatarMoeda(meta.valorDesejado) }}</p>

    <div class="mt-3 flex items-end justify-between">
      <span class="text-lg font-semibold text-gray-900">{{ formatarMoeda(meta.valorTotal) }}</span>
      <span class="text-sm font-medium text-gray-500">{{ percentual }}%</span>
    </div>

    <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div class="h-full rounded-full bg-black" :style="{ width: `${percentual}%` }" />
    </div>

    <p class="mt-2 text-xs text-gray-400">
      {{ pausada ? 'Meta pausada' : meses === 0 ? 'Prazo atingido' : `Faltam ${meses} ${meses === 1 ? 'mês' : 'meses'}` }}
    </p>
  </button>
</template>
