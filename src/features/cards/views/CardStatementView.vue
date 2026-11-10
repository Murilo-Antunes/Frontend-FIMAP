<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CardsErrorState from '../components/CardsErrorState.vue'
import CardStatementHeader from '../components/CardStatementHeader.vue'
import StatementFilters from '../components/StatementFilters.vue'
import StatementMonthTabs from '../components/StatementMonthTabs.vue'
import StatementTransactionGroup from '../components/StatementTransactionGroup.vue'
import { useCardStatement } from '../composables/useCardStatement'

const props = defineProps<{ cartaoId: string }>()

const router = useRouter()

const {
  dados,
  status,
  erro,
  busca,
  categoria,
  mesAtivo,
  meses,
  categorias,
  grupos,
  totalFiltrado,
  temFiltroAtivo,
  selecionarMes,
  limparFiltros,
  recarregar,
  definirCategoria,
} = useCardStatement(() => props.cartaoId)

const carregandoLista = computed(() => status.value === 'carregando' || status.value === 'sincronizando')
const sincronizando = computed(() => status.value === 'sincronizando')

const resumoResultado = computed(() => {
  if (status.value !== 'pronto') return ''
  return totalFiltrado.value === 1
    ? '1 lançamento encontrado'
    : `${totalFiltrado.value} lançamentos encontrados`
})

function voltarParaCartao(): void {
  void router.push({ name: 'card-detail', params: { cartaoId: props.cartaoId } })
}
</script>

<template>
  <main class="mx-auto w-full max-w-[1440px] px-6 pb-16 pt-10 sm:px-[60px]">
    <header>
      <h1 class="text-[28px] font-semibold tracking-tight text-neutral-900">Extrato do Cartão</h1>
      <p class="mt-1 text-sm text-neutral-500">Visualize o extrato do seu cartão</p>
    </header>

    <!-- Falha na primeira carga: não há nada para mostrar além do erro -->
    <div v-if="!dados && status === 'erro'" class="mt-8">
      <CardsErrorState :mensagem="erro ?? 'Não foi possível carregar o extrato.'" @tentar="recarregar" />
      <p class="text-center">
        <button type="button" class="text-xs font-medium text-neutral-900 underline" @click="voltarParaCartao">
          Voltar para o cartão
        </button>
      </p>
    </div>

    <!-- Primeira carga -->
    <div v-else-if="!dados" class="mt-8 flex flex-col gap-6" aria-busy="true">
      <p v-if="sincronizando" role="status" class="text-sm text-neutral-500">
        Sincronizando seus dados com o banco. Isso pode levar alguns segundos…
      </p>
      <div class="h-[120px] animate-pulse rounded-3xl bg-neutral-200" />
      <div class="h-[43px] animate-pulse rounded-2xl bg-neutral-200" />
      <div class="h-[260px] animate-pulse rounded-3xl bg-neutral-200" />
    </div>

    <div v-else class="mt-8 flex flex-col gap-6">
      <CardStatementHeader :cartao="dados.cartao" :fatura="dados.fatura" />

      <StatementMonthTabs :meses="meses" :ativo="mesAtivo" @selecionar="selecionarMes" />

      <StatementFilters
        v-model:busca="busca"
        :categoria="categoria"
        :categorias="categorias"
        @update:categoria="definirCategoria"
      />

      <p class="sr-only" role="status" aria-live="polite">{{ resumoResultado }}</p>

      <div v-if="status === 'erro'">
        <CardsErrorState :mensagem="erro ?? 'Não foi possível carregar o extrato.'" @tentar="recarregar" />
      </div>

      <div v-else-if="carregandoLista" class="flex flex-col gap-6" aria-busy="true">
        <p v-if="sincronizando" role="status" class="text-sm text-neutral-500">
          Sincronizando seus dados com o banco. Isso pode levar alguns segundos…
        </p>
        <div class="h-[180px] animate-pulse rounded-3xl bg-neutral-200" />
        <div class="h-[240px] animate-pulse rounded-3xl bg-neutral-200" />
      </div>

      <div
        v-else-if="grupos.length === 0"
        class="rounded-3xl border border-neutral-200 bg-white px-6 py-12 text-center shadow-sm"
      >
        <p class="text-sm font-medium text-neutral-900">
          {{
            temFiltroAtivo
              ? 'Nenhum lançamento encontrado para esses filtros.'
              : 'Nenhum lançamento neste período.'
          }}
        </p>
        <button
          v-if="temFiltroAtivo"
          type="button"
          class="mt-3 text-xs font-medium text-neutral-900 underline"
          @click="limparFiltros"
        >
          Limpar filtros
        </button>
      </div>

      <template v-else>
        <StatementTransactionGroup v-for="grupo in grupos" :key="grupo.chave" :grupo="grupo" />
      </template>
    </div>
  </main>
</template>
