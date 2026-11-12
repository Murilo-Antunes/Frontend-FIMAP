<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Globe, Landmark } from 'lucide-vue-next'

import { connectionService } from '@/features/connection/services/connection.service'
import type { BankConnection } from '@/features/connection/types/connection.types'
import { toApiError } from '@/lib/api/types/api-error'
import SettingsCard from './SettingsCard.vue'

const props = defineProps<{ idUsuario: number }>()

const router = useRouter()

const connections = ref<BankConnection[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

interface BankItem {
  key: string
  name: string
  statusLabel: string
}

/** Status do Pluggy (item.status) → texto do card. */
const STATUS_LABEL: Record<string, string> = {
  UPDATED: 'Sincronizado',
  UPDATING: 'Sincronizando',
  WAITING_USER_INPUT: 'Ação necessária',
  LOGIN_ERROR: 'Reconectar',
  OUTDATED: 'Desatualizado',
}

function readString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim() !== '') return value
  }
  return undefined
}

/**
 * Único ponto que conhece o formato de BankConnection. Ajuste os nomes dos campos aqui
 * se o seu tipo usar outros (os candidatos abaixo são suposições, o tipo não foi enviado).
 */
function toBankItem(connection: BankConnection, index: number): BankItem {
  const raw = connection as unknown as Record<string, unknown>
  const name = readString(raw, ['nome', 'instituicao', 'connectorName', 'name']) ?? 'Instituição'
  const status = readString(raw, ['status'])
  return {
    key: readString(raw, ['itemId', 'id']) ?? `${name}-${index}`,
    name,
    statusLabel: (status && STATUS_LABEL[status]) || 'Conectado',
  }
}

const banks = computed<BankItem[]>(() => connections.value.map(toBankItem))

const countLabel = computed(() => {
  const total = banks.value.length
  return `${total} ${total === 1 ? 'banco ativo' : 'bancos ativos'}`
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    connections.value = await connectionService.listConnections(props.idUsuario)
  } catch (e) {
    error.value = toApiError(e).mensagem
  } finally {
    loading.value = false
  }
}

function manage(): void {
  void router.push('/contas')
}

onMounted(load)
</script>

<template>
  <SettingsCard title="Open Finance" :icon="Globe">
    <template v-if="!loading && !error" #aside>
      <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
        {{ countLabel }}
      </span>
    </template>

    <div class="flex items-center justify-between gap-4 py-4">
      <div>
        <p class="text-sm font-medium text-neutral-900">Instituições Vinculadas</p>
        <p class="mt-0.5 text-xs text-neutral-500">Sincronização bancária automática</p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        @click="manage"
      >
        Gerenciar
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="h-[122px] animate-pulse rounded-xl bg-neutral-100" />
    </div>

    <div v-else-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
      <p>{{ error }}</p>
      <button type="button" class="mt-2 font-medium underline" @click="load">Tentar novamente</button>
    </div>

    <p
      v-else-if="banks.length === 0"
      class="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500"
    >
      Nenhuma conta conectada ainda. Use “Gerenciar” para conectar seu primeiro banco.
    </p>

    <ul v-else class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <li
        v-for="bank in banks"
        :key="bank.key"
        class="flex flex-col items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-3 py-5 text-center"
      >
        <span class="grid size-10 place-items-center rounded-lg bg-neutral-100 text-neutral-700">
          <Landmark class="size-5" aria-hidden="true" />
        </span>
        <div>
          <p class="text-sm font-medium text-neutral-900">{{ bank.name }}</p>
          <p class="mt-1 text-xs text-indigo-600">{{ bank.statusLabel }}</p>
        </div>
      </li>
    </ul>
  </SettingsCard>
</template>
