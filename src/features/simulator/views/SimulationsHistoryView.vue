<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle, Plus } from 'lucide-vue-next'
import SimulatorTabs from '../components/SimulatorTabs.vue'
import SimulationCard from '../components/SimulationCard.vue'
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog.vue'
import { useSimulationHistory } from '../composables/useSimulationHistory'
import { isSimulationKind } from '../lib/guards'
import type { HistoryEntry, SimulationKind } from '../types/simulator.types'

const route = useRoute()
const router = useRouter()

// A aba ativa vive na URL (?tipo=amortizacoes) para o "voltar" do simulador cair na aba certa.
const kind = computed<SimulationKind>({
  get: () => (isSimulationKind(route.query.tipo) ? route.query.tipo : 'investimentos'),
  set: (value) =>
    void router.replace({
      name: 'simulations-history',
      query: value === 'investimentos' ? {} : { tipo: value },
    }),
})

const {
  entries,
  status,
  errorMessage,
  loadingMore,
  loadMoreError,
  hasMore,
  deletingId,
  reload,
  loadMore,
  remove,
} = useSimulationHistory(kind)

const emptyText = computed(() =>
  kind.value === 'investimentos'
    ? 'Você ainda não salvou nenhuma simulação de investimento.'
    : 'Você ainda não salvou nenhuma simulação de amortização.',
)

function open(entry: HistoryEntry): void {
  void router.push({
    name: 'simulator-edit',
    params: { tipo: entry.kind, id: entry.data.id },
  })
}

function create(): void {
  void router.push({ name: 'simulator-new', params: { tipo: kind.value } })
}

// Exclusão com confirmação
const pendingDelete = ref<HistoryEntry | null>(null)
const deleteError = ref('')

function askDelete(entry: HistoryEntry): void {
  deleteError.value = ''
  pendingDelete.value = entry
}

async function confirmDelete(): Promise<void> {
  const entry = pendingDelete.value
  if (!entry) return
  const failure = await remove(entry)
  if (failure) deleteError.value = failure
  else pendingDelete.value = null
}

function cancelDelete(): void {
  if (deletingId.value === null) pendingDelete.value = null
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1280px] px-6 py-10">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-neutral-950">Histórico de Simulações</h1>
        <p class="mt-1 text-sm text-neutral-500">Visualize as suas principais simulações financeiras</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        @click="create"
      >
        <Plus class="size-4" aria-hidden="true" />
        Nova simulação
      </button>
    </header>

    <div class="mt-8">
      <SimulatorTabs v-model="kind" />
    </div>

    <!-- Carregando -->
    <div
      v-if="status === 'loading'"
      class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Carregando simulações"
    >
      <div v-for="n in 3" :key="n" class="h-72 animate-pulse rounded-2xl bg-neutral-200/60" />
    </div>

    <!-- Erro -->
    <div v-else-if="status === 'error'" role="alert" class="mt-16 text-center">
      <p class="text-sm text-neutral-700">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-4 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        @click="reload"
      >
        Tentar novamente
      </button>
    </div>

    <!-- Vazio -->
    <div v-else-if="entries.length === 0" class="mt-16 text-center">
      <p class="text-sm text-neutral-500">{{ emptyText }}</p>
      <button
        type="button"
        class="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        @click="create"
      >
        <Plus class="size-4" aria-hidden="true" />
        Criar primeira simulação
      </button>
    </div>

    <!-- Lista -->
    <template v-else>
      <div class="mt-8 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SimulationCard
          v-for="entry in entries"
          :key="`${entry.kind}-${entry.data.id}`"
          :entry="entry"
          :deleting="deletingId === entry.data.id"
          @open="open(entry)"
          @remove="askDelete(entry)"
        />
      </div>

      <div v-if="hasMore || loadMoreError" class="mt-8 text-center">
        <p v-if="loadMoreError" role="alert" class="mb-3 text-sm text-red-600">{{ loadMoreError }}</p>
        <button
          type="button"
          :disabled="loadingMore"
          class="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
          @click="loadMore"
        >
          <LoaderCircle v-if="loadingMore" class="size-4 animate-spin" aria-hidden="true" />
          Carregar mais
        </button>
      </div>
    </template>

    <ConfirmDeleteDialog
      :open="pendingDelete !== null"
      :name="pendingDelete?.data.nome ?? ''"
      :busy="deletingId !== null"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
