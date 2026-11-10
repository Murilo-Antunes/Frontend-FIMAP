<script setup lang="ts">
import { computed } from 'vue'
import type { StatusRecurso, TransacaoCartao } from '../types/cards.types'
import { resolverIconeTransacao } from '../utils/card-icons'
import { formatarMoeda, interpretarDataHora } from '../utils/format'
import { agruparPorDia, descreverTransacao } from '../utils/transactions'
import CardsErrorState from './CardsErrorState.vue'

const props = defineProps<{
  transacoes: TransacaoCartao[]
  status: StatusRecurso
  erro: string | null
}>()

defineEmits<{ tentar: []; 'ver-extrato': [] }>()

const carregando = computed(
  () => props.status === 'idle' || props.status === 'carregando' || props.status === 'sincronizando',
)
const grupos = computed(() => agruparPorDia(props.transacoes))

function hora(t: TransacaoCartao): string | null {
  return t.data ? interpretarDataHora(t.data).hora : null
}
</script>

<template>
  <section aria-labelledby="historico-titulo">
    <header class="mb-3 flex items-center justify-between">
      <h2 id="historico-titulo" class="text-xl font-semibold tracking-tight text-neutral-900">
        Histórico do Cartão
      </h2>
      <button
        type="button"
        class="text-xs font-medium text-neutral-900 hover:underline"
        @click="$emit('ver-extrato')"
      >
        Ver extrato
      </button>
    </header>

    <div v-if="carregando" aria-busy="true">
      <div class="animate-pulse space-y-4 rounded-2xl bg-white p-5">
        <div v-for="n in 3" :key="n" class="flex items-center gap-4">
          <div class="size-10 rounded-xl bg-neutral-100" />
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/2 rounded bg-neutral-100" />
            <div class="h-2.5 w-1/3 rounded bg-neutral-100" />
          </div>
          <div class="h-4 w-16 rounded bg-neutral-100" />
        </div>
      </div>
      <p v-if="status === 'sincronizando'" class="mt-3 text-xs text-neutral-400" role="status">
        Sincronizando com o banco…
      </p>
    </div>

    <div v-else-if="status === 'erro'" class="rounded-2xl bg-white">
      <CardsErrorState compacto :mensagem="erro" @tentar="$emit('tentar')" />
    </div>

    <p v-else-if="grupos.length === 0" class="rounded-2xl bg-white px-5 py-10 text-center text-sm text-neutral-500">
      Nenhuma transação encontrada para este cartão.
    </p>

    <div v-else class="space-y-3">
      <div v-for="grupo in grupos" :key="grupo.chave" class="rounded-2xl bg-white px-4 py-4">
        <h3 class="px-1 pb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
          {{ grupo.rotulo }}
        </h3>

        <ul class="divide-y divide-neutral-100">
          <li v-for="t in grupo.itens" :key="t.id" class="flex items-center gap-4 px-1 py-3">
            <span class="grid size-10 flex-none place-items-center rounded-xl bg-neutral-100 text-neutral-600">
              <component :is="resolverIconeTransacao(t.categoria)" :size="18" :stroke-width="1.75" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-neutral-900">{{ t.estabelecimento }}</p>
              <p class="truncate text-xs text-neutral-500">{{ t.categoria }}</p>
              <p class="truncate text-[11px] text-neutral-400">{{ descreverTransacao(t) }}</p>
            </div>

            <div class="flex-none text-right">
              <p
                class="text-sm font-semibold"
                :class="t.tipo === 'CREDITO' ? 'text-emerald-600' : 'text-neutral-900'"
              >
                {{ t.tipo === 'CREDITO' ? '+ ' : '' }}{{ formatarMoeda(t.valor) }}
              </p>
              <p v-if="hora(t)" class="text-xs text-neutral-400">{{ hora(t) }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
