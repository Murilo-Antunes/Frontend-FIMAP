<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useConnectionStore } from '@/stores/connection.store'
import { toApiError } from '@/lib/api/types/api-error'
import { loansService } from '../services/loans.service'
import { buildMockAnticipationOpportunity, mapLoanDetail } from '../services/loans.mapper'
import type { LoanDetail } from '../types/loans.types'
import LoanOverviewCard from '../components/LoanOverviewCard.vue'
import LoanOpportunityCard from '../components/LoanOpportunityCard.vue'
import LoanStatusTabs, { type LoanStatusTab } from '../components/LoanStatusTabs.vue'
import LoanInstallmentRow from '../components/LoanInstallmentRow.vue'
import LoanPaidSummaryRow from '../components/LoanPaidSummaryRow.vue'

const PAGAS_POR_PAGINA = 10

const route = useRoute()
const router = useRouter()
const connectionStore = useConnectionStore()

const loanId = computed(() => String(route.params.id))

const loading = ref(true)
const loadingMorePaid = ref(false)
const errorMessage = ref<string | null>(null)
const detail = ref<LoanDetail | null>(null)
const activeTab = ref<LoanStatusTab>('todas')
const limitePagas = ref(PAGAS_POR_PAGINA)

// MOCK — ver aviso enviado junto com este código.
const opportunity = buildMockAnticipationOpportunity()

let controller: AbortController | null = null

async function load(options: { silent?: boolean } = {}) {
  if (!options.silent) loading.value = true
  errorMessage.value = null
  controller = new AbortController()

  try {
    const itemId = await connectionStore.requireItemId()
    const data = await loansService.getLoanDetail(itemId, loanId.value, limitePagas.value, controller.signal)
    detail.value = mapLoanDetail(data)
  } catch (error) {
    errorMessage.value = toApiError(error).mensagem
  } finally {
    loading.value = false
    loadingMorePaid.value = false
  }
}

async function carregarMaisPagas() {
  loadingMorePaid.value = true
  limitePagas.value += PAGAS_POR_PAGINA
  await load({ silent: true })
}

const counts = computed(() => ({
  todas: (detail.value?.pendentes.length ?? 0) + (detail.value?.loan.parcelasPagas ?? 0) + (detail.value?.amortizadas.length ?? 0),
  pendentes: detail.value?.pendentes.length ?? 0,
  pagas: detail.value?.loan.parcelasPagas ?? 0,
  amortizadas: detail.value?.amortizadas.length ?? 0,
}))

function goBack() {
  router.push({ name: 'loans' })
}

function handleAnticipar() {
  // TODO: abrir o Simulador Financeiro quando a funcionalidade estiver pronta.
}

onMounted(() => load())
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-8">
    <button type="button" class="mb-4 text-neutral-500 transition hover:text-neutral-900" @click="goBack">
      <ArrowLeft class="h-5 w-5" />
    </button>

    <header class="mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900">Histórico de Empréstimos</h1>
      <p class="mt-1 text-sm text-neutral-500">Veja o seu histórico de empréstimos</p>
    </header>

    <p v-if="loading" class="text-sm text-neutral-500">Carregando…</p>
    <p v-else-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

    <template v-else-if="detail">
      <div class="mb-8 grid gap-6 lg:grid-cols-2">
        <LoanOverviewCard :loan="detail.loan" />
        <LoanOpportunityCard
          eyebrow="Oportunidade"
          icon="trending-down"
          :opportunity="opportunity"
          @primary-action="handleAnticipar"
        />
      </div>

      <LoanStatusTabs v-model="activeTab" :counts="counts" />

      <section v-if="activeTab === 'todas' || activeTab === 'pendentes'" class="mt-6">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-semibold text-neutral-900">
            Parcelas Futuras / Pendentes
            <span class="ml-1 font-normal text-neutral-500">{{ detail.pendentes.length }} restantes</span>
          </h2>
          <span class="text-xs text-neutral-400">Ordenadas por vencimento cronológico</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <LoanInstallmentRow
            v-for="installment in detail.pendentes"
            :key="installment.numero"
            :installment="installment"
            variant="card"
            @antecipar="handleAnticipar"
          />
        </div>
      </section>

      <section v-if="activeTab === 'todas' || activeTab === 'pagas'" class="mt-10">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-base font-semibold text-neutral-900">
            Parcelas Pagas
            <span class="ml-1 font-normal text-neutral-500">{{ detail.loan.parcelasPagas }} liquidadas</span>
          </h2>
          <span class="text-xs text-neutral-400">Valores compensados via Open Finance</span>
        </div>
        <div class="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white px-5">
          <LoanInstallmentRow
            v-for="installment in detail.pagasVisiveis"
            :key="installment.numero"
            :installment="installment"
            variant="row"
          />
          <LoanPaidSummaryRow
            v-if="detail.pagasResumoRestante"
            :resumo="detail.pagasResumoRestante"
            :carregando="loadingMorePaid"
            @carregar-mais="carregarMaisPagas"
          />
        </div>
      </section>

      <section v-if="activeTab === 'amortizadas'" class="mt-6">
        <p v-if="detail.amortizadas.length === 0" class="text-sm text-neutral-500">
          Nenhuma parcela amortizada neste contrato ainda.
        </p>
        <div v-else class="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white px-5">
          <LoanInstallmentRow
            v-for="installment in detail.amortizadas"
            :key="installment.numero"
            :installment="installment"
            variant="row"
          />
        </div>
      </section>
    </template>
  </div>
</template>