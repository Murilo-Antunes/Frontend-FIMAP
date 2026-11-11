<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { useConnectionStore } from '@/stores/connection.store'
import { toApiError } from '@/lib/api/types/api-error'
import { loansService } from '../services/loans.service'
import { buildMockPortabilityOpportunity, mapLoan, mapLoanDetail } from '../services/loans.mapper'
import type { Loan, LoanInstallment } from '../types/loans.types'
import LoanOverviewCard from '../components/LoanOverviewCard.vue'
import LoanOpportunityCard from '../components/LoanOpportunityCard.vue'
import LoanInstallmentRow from '../components/LoanInstallmentRow.vue'

const router = useRouter()
const connectionStore = useConnectionStore()

interface LoanWithPreview {
  loan: Loan
  preview: LoanInstallment[]
}

const loading = ref(true)
const errorMessage = ref<string | null>(null)
const syncing = ref(false)
const loans = ref<LoanWithPreview[]>([])

// MOCK — ver aviso enviado junto com este código.
const opportunity = buildMockPortabilityOpportunity()

let controller: AbortController | null = null

async function loadLoans() {
  loading.value = true
  errorMessage.value = null
  controller = new AbortController()

  try {
    const itemId = await connectionStore.requireItemId()
    const response = await loansService.listLoans(itemId, controller.signal)
    syncing.value = response.atualizando

    loans.value = await Promise.all(
      response.emprestimos.map(async (raw) => {
        // limitePagas: 3 é suficiente — só precisamos de até 3 linhas pra pré-visualização.
        const data = await loansService.getLoanDetail(itemId, raw.id, 3, controller!.signal)
        const detail = mapLoanDetail(data)
        const loan = detail?.loan ?? mapLoan(raw)

        const preview = detail
          ? [...detail.pendentes, ...detail.pagasVisiveis].sort((a, b) => b.numero - a.numero).slice(0, 3)
          : []

        return { loan, preview }
      }),
    )
  } catch (error) {
    errorMessage.value = toApiError(error).mensagem
  } finally {
    loading.value = false
  }
}

function goToHistory(loanId: string) {
  router.push({ name: 'loan-history', params: { id: loanId } })
}

function handleOpportunityAction() {
  // TODO: abrir o Simulador Financeiro quando a funcionalidade estiver pronta.
}

onMounted(loadLoans)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-8">
    <header class="mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900">Empréstimos</h1>
      <p class="mt-1 text-sm text-neutral-500">Veja cronogramas, saldos e oportunidades de empréstimos</p>
    </header>

    <p v-if="loading" class="text-sm text-neutral-500">Carregando empréstimos…</p>
    <p v-else-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <p v-else-if="loans.length === 0" class="text-sm text-neutral-500">
      Nenhum empréstimo encontrado nas contas conectadas.
    </p>

    <template v-else>
      <p v-if="syncing" class="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Ainda sincronizando os dados dos seus empréstimos via Open Finance. Alguns valores podem demorar a aparecer.
      </p>

      <div v-for="entry in loans" :key="entry.loan.id" class="mb-8 grid gap-6 lg:grid-cols-2">
        <LoanOverviewCard :loan="entry.loan" />

        <LoanOpportunityCard
          eyebrow="Oportunidade detectada por IA"
          icon="sparkles"
          eyebrow-variant="caps"
          :opportunity="opportunity"
          @primary-action="handleOpportunityAction"
        />

        <div class="rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-2">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="text-base font-semibold text-neutral-900">Cronograma de Parcelas</h2>
              <p class="text-sm text-neutral-500">Acompanhamento e quitação antecipada de lançamentos</p>
            </div>
            <span class="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              {{ entry.loan.parcelasRestantes }} parcelas pendentes
            </span>
          </div>

          <div class="divide-y divide-neutral-100">
            <LoanInstallmentRow
              v-for="installment in entry.preview"
              :key="installment.numero"
              :installment="installment"
              variant="row"
            />
          </div>

          <button
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            @click="goToHistory(entry.loan.id)"
          >
            Ver histórico completo
            <ChevronDown class="h-4 w-4" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>