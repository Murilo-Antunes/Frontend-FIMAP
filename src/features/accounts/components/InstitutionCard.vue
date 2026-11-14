<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Clock, Trash2 } from 'lucide-vue-next'
import { formatBRL, formatRelative, minutesSince } from '@/lib/formatters'
import InstitutionAvatar from './InstitutionAvatar.vue'
import type { Institution } from '../types/accounts.types'
import { connectionService } from '@/features/connection/services/connection.service'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps<{ institution: Institution }>()
const emit = defineEmits(['deleted'])

const authStore = useAuthStore()
const connectionId = ref<number | null>(null)

onMounted(async () => {
  const userId = authStore.usuario?.id
  if (userId) {
    const connections = await connectionService.listConnections(userId)
    // O backend retorna 'external_connection_id' que mapeia para o itemId do nosso modelo
    const conn = connections.find(c => c.external_connection_id === props.institution.itemId)
    if (conn) {
      connectionId.value = conn.id
    }
  }
})

const deleteConnection = async () => {
  if (!connectionId.value) {
    console.error('ID da conexão não encontrado para esta instituição')
    return
  }
  
  const userId = authStore.usuario?.id
  if (!userId) return
  
  if (confirm(`Tem certeza que deseja remover a conexão com ${props.institution.name}?`)) {
    try {
      await connectionService.deleteConexoes(userId, connectionId.value)
      emit('deleted')
    } catch (error) {
      console.error('Erro ao deletar conexão:', error)
      alert('Erro ao remover a conexão.')
    }
  }
}

const sync = computed(() => {
  const iso = props.institution.updatedAt
  if (!iso) return null
  return minutesSince(iso) < 2
    ? { fresh: true, label: 'Sincronizado agora' }
    : { fresh: false, label: `Sincronizado ${formatRelative(iso)}` }
})
</script>

<template>
  <article class="relative flex flex-col rounded-3xl bg-white p-6 shadow-sm">
    <button
      @click="deleteConnection"
      class="absolute right-4 top-4 rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600"
      aria-label="Remover conexão"
    >
      <Trash2 :size="18" />
    </button>
    <div class="flex items-center gap-3">
      <InstitutionAvatar :name="institution.name" :logo-url="institution.logoUrl" />
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-neutral-900">{{ institution.name }}</h3>
        <p v-if="institution.accountLabel" class="truncate text-xs text-neutral-500">{{ institution.accountLabel }}</p>
      </div>
    </div>

    <p class="mt-6 text-xs text-neutral-500">Saldo disponível</p>
    <p class="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{{ formatBRL(institution.balance) }}</p>

    <div v-if="sync" class="mt-5 border-t border-neutral-100 pt-4">
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs"
        :class="sync.fresh ? 'text-neutral-600' : 'text-neutral-500'"
      >
        <span v-if="sync.fresh" class="size-1.5 rounded-full bg-emerald-500" />
        <Clock v-else class="size-3" aria-hidden="true" />
        {{ sync.label }}
      </span>
    </div>
  </article>
</template>
