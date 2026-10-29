<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Clock, CreditCard, Eye, EyeOff, RefreshCw, TrendingDown, TrendingUp } from 'lucide-vue-next'
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
import { dashboardService, FinanceItemNotConfiguredError } from '../services/dashboard.service'
import type { DashboardOverview, EvolutionPeriod, EvolutionPoint } from '../types/dashboard.types'

const auth = useAuthStore()
const { hidden, toggle } = useHiddenValues()

const status = ref<'loading' | 'syncing' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
const overview = ref<DashboardOverview | null>(null)

const period = ref<EvolutionPeriod>('mes')
const evolution = ref<EvolutionPoint[]>([])
const evolutionLoading = ref(false)
const evolutionError = ref(false)

let evolutionRequest = 0

async function loadEvolution(selected: EvolutionPeriod) {
  const request = ++evolutionRequest
  period.value = selected
  evolutionLoading.value = true
  evolutionError.value = false
  try {
    const points = await dashboardService.getEvolution(selected)
    if (request !== evolutionRequest) return
    if (points) evolution.value = points
    else evolutionError.value = true // API sincronizando: sem dados agora
  } catch {
    if (request === evolutionRequest) evolutionError.value = true
  } finally {
    if (request === evolutionRequest) evolutionLoading.value = false
  }
}

const POLL_INTERVAL_MS = 5_000
const POLL_MAX_ATTEMPTS = 12
let pollTimer: ReturnType<typeof setTimeout> | undefined
let pollAttempts = 0

function applyOverview(next: DashboardOverview) {
  overview.value = next
  if (!evolutionLoading.value) evolution.value = next.evolution
  status.value = 'ready'
}

function schedulePoll() {
  clearTimeout(pollTimer)
  const waiting = status.value === 'syncing' || overview.value?.updating === true
  if (!waiting) return

  if (pollAttempts >= POLL_MAX_ATTEMPTS) {
    if (status.value === 'syncing') {
      errorMessage.value = 'A sincronização está demorando. Tente novamente em instantes.'
      status.value = 'error'
    }
    return
  }

  pollAttempts += 1
  pollTimer = setTimeout(async () => {
    try {
      const next = await dashboardService.getOverview(period.value)
      if (next) applyOverview(next)
    } catch {
    }
    schedulePoll()
  }, POLL_INTERVAL_MS)
}

async function loadDashboard() {
  clearTimeout(pollTimer)
  pollAttempts = 0
  status.value = 'loading'
  errorMessage.value = ''
  evolutionRequest += 1 
  evolutionLoading.value = false
  evolutionError.value = false
  try {
    const loaded = await dashboardService.getOverview(period.value)
    if (loaded) applyOverview(loaded)
    else status.value = 'syncing'
    schedulePoll()
  } catch (error) {
    errorMessage.value =
      error instanceof FinanceItemNotConfiguredError ? error.message : toApiError(error).mensagem
    status.value = 'error'
  }
}

const percent = (value: number | null, signed = false) =>
  value === null ? '—' : formatPercent(value, { signed })

const cards = computed(() => overview.value?.summary.limite_cartoes)
const hasCardLimit = computed(() => (cards.value?.limite_total ?? 0) > 0)

onMounted(loadDashboard)
onBeforeUnmount(() => clearTimeout(pollTimer))
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

    <p
      v-if="overview?.updating && status === 'ready'"
      class="mb-4 flex items-center gap-2 text-xs text-neutral-500"
      role="status"
    >
      <RefreshCw :size="14" class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      Atualizando dados das suas instituições…
    </p>

    <DashboardSkeleton v-if="status === 'loading'" />

    <div
      v-else-if="status === 'syncing'"
      class="flex flex-col items-center gap-3 rounded-3xl border border-neutral-100 bg-white p-12 text-center shadow-sm"
      role="status"
    >
      <RefreshCw :size="28" class="animate-spin text-neutral-500 motion-reduce:animate-none" aria-hidden="true" />
      <h2 class="text-lg font-semibold">Sincronizando seus dados financeiros</h2>
      <p class="max-w-md text-sm text-neutral-500">
        Estamos buscando as informações das suas instituições. Isso pode levar alguns segundos e a tela
        atualiza sozinha.
      </p>
    </div>

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
          v-if="cards"
          :label="hasCardLimit ? 'Limite cartões' : 'Fatura cartões'"
          :icon="CreditCard"
          :value="formatNumber(hasCardLimit ? cards.disponivel : cards.fatura_aberta)"
          :footer-label="hasCardLimit ? 'Disponível' : 'Limite não informado'"
          :footer-value="hasCardLimit ? percent(cards.percentual_disponivel) : '—'"
          :progress="hasCardLimit ? (cards.percentual_disponivel ?? 0) : 0"
        />
        <SummaryCard
          label="Investido"
          :icon="Clock"
          :value="formatNumber(overview.summary.investido.valor)"
          footer-label="Do patrimônio"
          :footer-value="percent(overview.summary.investido.participacao_percentual)"
          :progress="overview.summary.investido.participacao_percentual ?? 0"
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
