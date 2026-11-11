<script setup lang="ts">
import { CirclePlus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/shared/PageHeader.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ConsolidatedBalanceCard from '../components/ConsolidatedBalanceCard.vue'
import InstitutionCard from '../components/InstitutionCard.vue'
import StatementSection from '../components/StatementSection.vue'
import { useAccountsData } from '../composables/useAccountsData'

const router = useRouter()
const { institutions, statement, totalBalance, loading, error, partial, reload } = useAccountsData()

function goConnect(): void {
  router.push({ name: 'connect-bank' })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1320px] flex-col gap-8 px-4 py-8 md:px-0">
    <PageHeader title="Contas Conectadas" subtitle="Gerencie suas instituições integradas via Open Finance">
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
          @click="goConnect"
        >
          <CirclePlus class="size-4" aria-hidden="true" />
          Conectar Nova Conta
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex flex-col gap-8" aria-busy="true">
      <div class="h-56 animate-pulse rounded-3xl bg-white" />
      <div class="grid gap-6 md:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-56 animate-pulse rounded-3xl bg-white" />
      </div>
      <div class="h-72 animate-pulse rounded-3xl bg-white" />
    </div>

    <ErrorState v-else-if="error" :message="error" @retry="reload" />

    <EmptyState
      v-else-if="institutions.length === 0"
      title="Nenhuma conta conectada"
      description="Conecte uma instituição via Open Finance para ver saldos e movimentações aqui."
      action-label="Conectar Nova Conta"
      @action="goConnect"
    />

    <template v-else>
      <p v-if="partial" class="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Algumas instituições não responderam e podem estar com dados incompletos.
        <button type="button" class="font-medium underline" @click="reload">Recarregar</button>
      </p>

      <ConsolidatedBalanceCard :total="totalBalance" :institutions="institutions" />

      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-neutral-900">Instituições Bancárias</h2>
          <span class="text-xs text-neutral-500">Dados via Open Finance</span>
        </div>
        <div class="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <InstitutionCard v-for="i in institutions" :key="i.itemId" :institution="i" />
        </div>
      </section>

      <StatementSection :entries="statement" :institutions="institutions" />
    </template>
  </div>
</template>
