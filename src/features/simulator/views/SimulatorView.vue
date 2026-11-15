<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { History } from 'lucide-vue-next'
import SimulatorTabs from '../components/SimulatorTabs.vue'
import InvestmentSimulator from '../components/InvestmentSimulator.vue'
import AmortizationSimulator from '../components/AmortizationSimulator.vue'
import { useSimulationRecord } from '../composables/useSimulationRecord'
import { isAmortizationRecord, isInvestmentRecord, isSimulationKind } from '../lib/guards'
import type { SimulationKind, SimulationRecord } from '../types/simulator.types'

const route = useRoute()
const router = useRouter()

const kind = computed<SimulationKind>(() =>
  isSimulationKind(route.params.tipo) ? route.params.tipo : 'investimentos',
)
// Com :id → simulação existente (PATCH). Sem :id → criação em branco (POST).
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const editing = computed(() => id.value !== null)

const { record, status, errorMessage, adopt, reload } = useSimulationRecord(kind, id)

const investmentRecord = computed(() =>
  record.value && isInvestmentRecord(record.value) ? record.value : null,
)
const amortizationRecord = computed(() =>
  record.value && isAmortizationRecord(record.value) ? record.value : null,
)

// O seletor só alterna entre simulações NOVAS; uma simulação salva mantém seu tipo.
const tabKind = computed<SimulationKind>({
  get: () => kind.value,
  set: (value) => void router.replace({ name: 'simulator-new', params: { tipo: value } }),
})

function goToHistory(): void {
  void router.push({
    name: 'simulations-history',
    query: kind.value === 'investimentos' ? {} : { tipo: kind.value },
  })
}

/** POST bem-sucedido → a tela passa a ser a de uma simulação existente (próximos saves = PATCH). */
function onSaved(saved: SimulationRecord): void {
  const wasNew = id.value === null
  adopt(kind.value, saved)
  if (wasNew) {
    void router.replace({ name: 'simulator-edit', params: { tipo: kind.value, id: saved.id } })
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1280px] px-6 py-10">
    <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-neutral-950">Simulador Financeiro</h1>
        <p class="mt-1 text-sm text-neutral-500">Projete a força dos juros compostos em tempo real.</p>
      </div>

      <div class="flex items-center gap-3">
        <SimulatorTabs
          v-model="tabKind"
          :disabled="editing"
          disabled-hint="O tipo não pode ser alterado em uma simulação já salva."
        />
        <button
          type="button"
          aria-label="Histórico de simulações"
          title="Histórico de simulações"
          class="grid size-10 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
          @click="goToHistory"
        >
          <History class="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div
      v-if="status === 'loading'"
      class="grid gap-6 lg:grid-cols-2"
      role="status"
      aria-label="Carregando simulação"
    >
      <div class="h-[34rem] animate-pulse rounded-2xl bg-neutral-200/60" />
      <div class="h-[34rem] animate-pulse rounded-2xl bg-neutral-200/60" />
    </div>

    <div v-else-if="status === 'not-found'" class="mt-16 text-center" role="alert">
      <p class="text-sm text-neutral-700">Simulação não encontrada.</p>
      <button
        type="button"
        class="mt-4 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        @click="goToHistory"
      >
        Voltar ao histórico
      </button>
    </div>

    <div v-else-if="status === 'error'" class="mt-16 text-center" role="alert">
      <p class="text-sm text-neutral-700">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-4 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        @click="reload"
      >
        Tentar novamente
      </button>
    </div>

    <InvestmentSimulator
      v-else-if="kind === 'investimentos'"
      :record="investmentRecord"
      @saved="onSaved"
    />
    <AmortizationSimulator v-else :record="amortizationRecord" @saved="onSaved" />
  </div>
</template>
