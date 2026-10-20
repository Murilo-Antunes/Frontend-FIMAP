<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Clock, CreditCard, Eye, EyeOff, TrendingDown, TrendingUp } from 'lucide-vue-next'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useHiddenValues } from '@/composables/useHiddenValues'
import { toApiError } from '@/lib/api/types/api-error'
import { formatNumber, formatPercent } from '@/lib/format'
import { useAuthStore } from '@/stores/auth.store'
import BalanceOverview from '../components/BalanceOverview.vue'
import DashboardSkeleton from '../components/DashboardSkeleton.vue'
import FinancialCore from '../components/FinancialCore.vue'
import IncomeExpenseChart from '../components/IncomeExpenseChart.vue'
import RecentTransactions from '../components/RecentTransactions.vue'
import SummaryCard from '../components/SummaryCard.vue'
import { dashboardService } from '../services/dashboard.service'
import type { DashboardOverview, EvolutionPeriod, EvolutionPoint } from '../types/dashboard.types'

const auth = useAuthStore()
const { hidden, toggle } = useHiddenValues()

const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
const overview = ref<DashboardOverview | null>(null)

const period = ref<EvolutionPeriod>('semana')
const evolution = ref<EvolutionPoint[]>([])
const evolutionLoading = ref(false)
const evolutionError = ref(false)

// Evita que uma resposta antiga sobrescreva a de um período escolhido depois
let evolutionRequest = 0

async function loadEvolution(selected: EvolutionPeriod) {
  const request = ++evolutionRequest
  period.value = selected
  evolutionLoading.value = true
  evolutionError.value = false
  try {
    const data = await dashboardService.getEvolution(selected)
    if (request === evolutionRequest) evolution.value = data
  } catch {
    if (request === evolutionRequest) evolutionError.value = true
  } finally {
    if (request === evolutionRequest) evolutionLoading.value = false
  }
}

async function loadDashboard() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    overview.value = await dashboardService.getOverview()
    status.value = 'ready'
    await loadEvolution(period.value)
  } catch (error) {
    errorMessage.value = toApiError(error).mensagem
    status.value = 'error'
  }
}

/** null = sem base de comparação (ex.: ainda não existe o mês anterior). */
const percent = (value: number | null, signed = false) =>
  value === null ? '—' : formatPercent(value, { signed })

onMounted(loadDashboard)
</script>

<template>
  <div class="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-8 sm:pt-16 lg:px-[60px] lg:pt-24">
    <header class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
          Olá, {{ auth.usuario?.nome_exibicao ?? 'bem-vindo(a)' }}
        </h1>
        <p class="mt-1 text-sm text-neutral-500">Seu panorama consolidado</p>
      </div>

      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-black"
        :aria-label="hidden ? 'Mostrar valores' : 'Ocultar valores'"
        :aria-pressed="hidden"
        @click="toggle"
      >
        <EyeOff v-if="hidden" :size="18" />
        <Eye v-else :size="18" />
      </button>
    </header>

    <DashboardSkeleton v-if="status === 'loading'" />

    <ErrorState v-else-if="status === 'error'" :message="errorMessage" @retry="loadDashboard" />

    <div v-else-if="overview" class="space-y-6">
      <section aria-label="Resumo financeiro" class="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr]">
        <div class="md:col-span-2 lg:col-span-1 lg:row-span-2">
          <BalanceOverview :patrimonio="overview.summary.patrimonio" class="h-full" />
        </div>

        <SummaryCard
          tone="dark"
          label="Receita mensal"
          :icon="TrendingUp"
          :value="formatNumber(overview.summary.receita_mensal.valor)"
          footer-label="vs mês anterior"
          :footer-value="percent(overview.summary.receita_mensal.variacao_percentual, true)"
          :progress="overview.summary.receita_mensal.progresso"
        />
        <SummaryCard
          label="Despesas"
          :icon="TrendingDown"
          :value="formatNumber(overview.summary.despesas.valor)"
          :footer-label="
            overview.summary.despesas.variacao_percentual === null
              ? 'vs mês anterior'
              : overview.summary.despesas.variacao_percentual <= 0
                ? 'Economia'
                : 'Aumento'
          "
          :footer-value="percent(overview.summary.despesas.variacao_percentual)"
          :progress="overview.summary.despesas.progresso"
        />
        <SummaryCard
          label="Limite cartões"
          :icon="CreditCard"
          :value="formatNumber(overview.summary.limite_cartoes.disponivel)"
          footer-label="Disponível"
          :footer-value="percent(overview.summary.limite_cartoes.percentual_disponivel)"
          :progress="overview.summary.limite_cartoes.percentual_disponivel"
        />
        <SummaryCard
          label="Investido"
          :icon="Clock"
          :value="formatNumber(overview.summary.investido.valor)"
          footer-label="Progresso das metas"
          :footer-value="percent(overview.summary.investido.percentual_meta)"
          :progress="overview.summary.investido.percentual_meta ?? 0"
        />
      </section>

      <div class="grid gap-6 lg:grid-cols-[1.42fr_1fr]">
        <IncomeExpenseChart
          :data="evolution"
          :period="period"
          :loading="evolutionLoading"
          :error="evolutionError"
          @update:period="loadEvolution"
          @retry="loadEvolution(period)"
        />
        <FinancialCore :items="overview.core" />
      </div>

      <RecentTransactions :transactions="overview.transactions" />
    </div>
  </div>
</template>
