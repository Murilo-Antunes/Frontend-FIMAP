<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, TrendingUp } from 'lucide-vue-next'
import PageHeader from '@/components/shared/PageHeader.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { formatBRL, formatPercent, formatRelative, formatSignedBRL, formatSignedPercent } from '@/lib/formatters'
import AssetRowCard from '../components/AssetRowCard.vue'
import { useInvestmentsData } from '../composables/useInvestmentsData'
import type { AssetClassKey, PortfolioAsset } from '../types/investments.types'

const { summary, hasAssets, loading, error, partial, fetchedAt, reload } = useInvestmentsData()

const query = ref('')
const selectedClass = ref<AssetClassKey | null>(null)

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function matches(asset: PortfolioAsset, term: string): boolean {
  if (!term) return true
  return normalize([asset.name, asset.code ?? '', asset.subtitle, asset.classLabel].join(' ')).includes(term)
}

const sections = computed(() => {
  const term = normalize(query.value.trim())
  return (summary.value?.groups ?? [])
    .filter((g) => !selectedClass.value || g.key === selectedClass.value)
    .map((g) => {
      const assets = g.assets.filter((a) => matches(a, term))
      return { ...g, assets, subtotal: assets.reduce((s, a) => s + a.balance, 0) }
    })
    .filter((g) => g.assets.length > 0)
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-8 md:px-0">
    <PageHeader title="Ativos em Carteira" subtitle="Verifique todos os ativos em sua carteira" />

    <div v-if="loading" class="flex flex-col gap-6" aria-busy="true">
      <div class="h-44 animate-pulse rounded-3xl bg-white" />
      <div class="h-12 animate-pulse rounded-full bg-white" />
      <div class="h-64 animate-pulse rounded-3xl bg-white" />
    </div>

    <ErrorState v-else-if="error" :message="error" @retry="reload" />

    <EmptyState
      v-else-if="!hasAssets || !summary"
      title="Nenhum ativo encontrado"
      description="Não encontramos ativos nas instituições conectadas. Se acabou de conectar, aguarde a sincronização."
    />

    <template v-else>
      <p v-if="partial" class="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Algumas instituições não responderam; os valores podem estar incompletos.
        <button type="button" class="font-medium underline" @click="reload">Recarregar</button>
      </p>

      <section class="flex flex-wrap items-center gap-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div class="min-w-[240px]">
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium uppercase tracking-wider text-neutral-500">Total em ativos</span>
            <span
              v-if="summary.profitPct !== null"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600"
            >
              <TrendingUp class="size-3" aria-hidden="true" />
              {{ formatSignedPercent(summary.profitPct) }}
            </span>
          </div>
          <p class="mt-3 text-4xl font-semibold tracking-tight text-neutral-900">{{ formatBRL(summary.total) }}</p>
          <p v-if="fetchedAt" class="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <span class="size-1.5 rounded-full bg-emerald-500" />
            Atualizado via Open Finance {{ formatRelative(fetchedAt) }}
          </p>
        </div>

        <div class="flex flex-1 flex-wrap gap-4 md:justify-start lg:pl-10">
          <div v-if="summary.monthYield !== null" class="min-w-[220px] rounded-2xl bg-neutral-50 p-4">
            <p class="text-sm text-neutral-500">Rendimento Mês</p>
            <p class="mt-2 text-lg font-semibold" :class="summary.monthYield >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ formatSignedBRL(summary.monthYield) }}
            </p>
          </div>
          <div v-if="summary.twelveMonthsPct !== null" class="min-w-[220px] rounded-2xl bg-neutral-50 p-4">
            <p class="text-sm text-neutral-500">Rentabilidade 12 meses</p>
            <p class="mt-2 text-lg font-semibold text-neutral-900">{{ formatPercent(summary.twelveMonthsPct) }}</p>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <label class="flex w-full max-w-md items-center gap-3 rounded-full bg-white px-4 py-3 shadow-sm">
          <Search class="size-4 text-neutral-500" aria-hidden="true" />
          <input
            v-model="query"
            type="search"
            placeholder="Buscar ativo por nome, ticker ou tipo…"
            class="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
          />
        </label>

        <div class="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por classe">
          <button
            type="button"
            role="tab"
            :aria-selected="selectedClass === null"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="selectedClass === null ? 'bg-black text-white' : 'bg-white text-neutral-800 shadow-sm hover:bg-neutral-100'"
            @click="selectedClass = null"
          >
            Todos ({{ summary.assets.length }})
          </button>
          <button
            v-for="g in summary.groups"
            :key="g.key"
            type="button"
            role="tab"
            :aria-selected="selectedClass === g.key"
            class="rounded-full px-4 py-2 text-sm font-medium transition"
            :class="selectedClass === g.key ? 'bg-black text-white' : 'bg-white text-neutral-800 shadow-sm hover:bg-neutral-100'"
            @click="selectedClass = g.key"
          >
            {{ g.label }} ({{ g.assets.length }})
          </button>
        </div>
      </div>

      <p v-if="sections.length === 0" class="rounded-3xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
        Nenhum ativo corresponde à busca.
      </p>

      <section v-for="g in sections" :key="g.key" class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-3 text-base font-medium uppercase tracking-wide text-neutral-900">
            <span class="size-2.5 rounded-full bg-black" />
            {{ g.label }}
            <span class="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold normal-case text-neutral-700">
              {{ formatPercent(g.pct, 0) }}
            </span>
          </h2>
          <p class="text-base font-semibold text-neutral-900">Subtotal: {{ formatBRL(g.subtotal) }}</p>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <AssetRowCard v-for="asset in g.assets" :key="asset.id" :asset="asset" />
        </div>
      </section>
    </template>
  </div>
</template>
