import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { NoBankConnectionError } from '@/features/connection/errors/no-bank-connection.error'
import { connectionService } from '@/features/connection/services/connection.service'
import type { BankConnection } from '@/features/connection/types/connection.types'
import { useAuthStore } from './auth.store'

type ConnectionStatus = 'desconhecido' | 'conectado' | 'sem_conexao'

/**
 * Conexões bancárias do usuário logado. A fonte da verdade é o BACKEND: aqui fica só uma cópia em
 * memória para decidir a navegação. O external_connection_id nunca vai para localStorage/sessionStorage;
 * some ao recarregar a página e é buscado de novo.
 */
export const useConnectionStore = defineStore('connection', () => {
  const auth = useAuthStore()

  const connections = ref<BankConnection[]>([])
  const status = ref<ConnectionStatus>('desconhecido')
  let pending: Promise<void> | null = null

  const hasConnection = computed(() => status.value === 'conectado')
  /** Por enquanto o resumo consulta uma conexão por vez: usa a primeira. */
  const itemId = computed(() => connections.value[0]?.external_connection_id ?? null)

  function reset() {
    connections.value = []
    status.value = 'desconhecido'
    pending = null
  }

  /** Busca as conexões do usuário (requisições simultâneas compartilham a mesma chamada). */
  function load(): Promise<void> {
    if (!auth.usuario) return Promise.reject(new Error('Sessão não encontrada.'))
    if (!pending) {
      const userId = auth.usuario.id
      pending = connectionService
        .listConnections(userId)
        .then((list) => {
          console.log('ConnectionStore - Conexões carregadas:', list)
          connections.value = list
          status.value = list.length > 0 ? 'conectado' : 'sem_conexao'
          console.log('ConnectionStore - Status atualizado para:', status.value)
          console.log('ConnectionStore - hasConnection:', list.length > 0)
        })
        .finally(() => {
          pending = null
        })
    }
    return pending
  }

  function add(connection: BankConnection) {
    console.log('ConnectionStore - Adicionando conexão:', connection)
    connections.value = [
      ...connections.value.filter((c) => c.external_connection_id !== connection.external_connection_id),
      connection,
    ]
    status.value = 'conectado'
    console.log('ConnectionStore - Conexões atualizadas:', connections.value)
    console.log('ConnectionStore - Status após add:', status.value)
    console.log('ConnectionStore - hasConnection após add:', hasConnection.value)
  }

  /** external_connection_id para consultar dados; lança NoBankConnectionError se o usuário não conectou nada. */
  async function requireItemId(): Promise<string> {
    if (status.value === 'desconhecido') await load()
    if (!itemId.value) throw new NoBankConnectionError()
    return itemId.value
  }

  // Trocou de usuário ou saiu: descarta as conexões do anterior
  watch(
    () => auth.usuario?.id,
    () => reset(),
    { flush: 'sync' }, // zera na hora, antes de qualquer navegação que dependa das conexões
  )

  return { connections, status, hasConnection, itemId, load, add, reset, requireItemId }
})
