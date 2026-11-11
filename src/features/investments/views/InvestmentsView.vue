<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/shared/PageHeader.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import PatrimonyCard from '../components/PatrimonyCard.vue'
import EvolutionChart from '../components/EvolutionChart.vue'
import AllocationCard from '../components/AllocationCard.vue'
import AssetPreviewCard from '../components/AssetPreviewCard.vue'
import { useInvestmentsData } from '../composables/useInvestmentsData'
import { useEvolution } from '../composables/useEvolution'

const PREVIEW_COUNT = 4

const router = useRouter()
const { summary, itemIds, hasAssets, loading, error, partial, reload } = useInvestmentsData()
const evolution = useEvolution(itemIds)

const preview = computed(() => summary.value?.assets.slice(0, PREVIEW_COUNT) ?? [])
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-8 md:px-0">
    <PageHeader title="Investimento" subtitle="Acompanhe sua carteira e rentabilidade via Open Finance" />

    <div v-if="loading" class="flex flex-col gap-6" aria-busy="true">
      <div class="grid gap-6 lg:grid-cols-[5fr_7fr]">
        <div class="h-72 animate-pulse rounded-3xl bg-white" />
        <div class="h-72 animate-pulse rounded-3xl bg-white" />
      </div>
      <div class="h-60 animate-pulse rounded-3xl bg-white" />
    </div>

    <ErrorState v-else-if="error" :message="error" @retry="reload" />

    <EmptyState
      v-else-if="!hasAssets || !summary"
      title="Nenhum investimento encontrado"
      description="Não encontramos investimentos nas instituições conectadas. Se acabou de conectar, aguarde a sincronização."
    />

    <template v-else>
      <p v-if="partial" class="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Algumas instituições não responderam; os valores podem estar incompletos.
        <button type="button" class="font-medium underline" @click="reload">Recarregar</button>
      </p>

      <div class="grid gap-6 lg:grid-cols-[5fr_7fr]">
        <PatrimonyCard :summary="summary" />
        <EvolutionChart
          v-model:period="evolution.period.value"
          :points="evolution.points.value"
          :loading="evolution.loading.value"
          :error="evolution.error.value"
          @retry="evolution.reload"
        />
      </div>

      <AllocationCard :groups="summary.groups" />

      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-neutral-900">Seus Ativos em Carteira</h2>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-900"
            @click="router.push({ name: 'portfolio-assets' })"
          >
            Ver todos ({{ summary.assets.length }})
            <ChevronRight class="size-4" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AssetPreviewCard v-for="asset in preview" :key="asset.id" :asset="asset" />
        </div>
      </section>
    </template>
  </div>
</template>
