import { computed, onMounted, onScopeDispose, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { listConnectionRefs } from '@/features/connection/services/connection-refs'
import { fetchAccounts, fetchStatement } from '../services/accounts.service'
import { buildInstitution } from '../services/accounts.mapper'
import type { Institution, StatementEntry } from '../types/accounts.types'

export function useAccountsData() {
  const auth = useAuthStore()

  const institutions = ref<Institution[]>([])
  const statement = ref<StatementEntry[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  /** true quando alguma conexão falhou mas outras carregaram. */
  const partial = ref(false)

  let controller: AbortController | null = null

  const totalBalance = computed(() => institutions.value.reduce((sum, i) => sum + i.balance, 0))

  async function load(): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    loading.value = true
    error.value = null
    partial.value = false

    try {
      const refs = await listConnectionRefs(auth.usuario?.id??0, signal)

      const results = await Promise.all(
        refs.map(async (ref) => {
          const [accounts, entries] = await Promise.allSettled([fetchAccounts(ref.itemId, signal), fetchStatement(ref, signal)])
          return { ref, accounts, entries }
        }),
      )
      if (signal.aborted) return

      const builtInstitutions: Institution[] = []
      const allEntries: StatementEntry[] = []
      let failures = 0

      for (const { ref, accounts, entries } of results) {
        if (accounts.status === 'fulfilled') {
          const institution = buildInstitution(ref, accounts.value, builtInstitutions.length)
          if (institution) builtInstitutions.push(institution)
        } else {
          failures += 1
        }
        if (entries.status === 'fulfilled') allEntries.push(...entries.value)
        else failures += 1
      }

      if (refs.length > 0 && failures === refs.length * 2) {
        throw new Error('Não foi possível carregar os dados das suas contas.')
      }

      institutions.value = builtInstitutions
      statement.value = allEntries.sort((a, b) => b.timestamp - a.timestamp)
      partial.value = failures > 0
    } catch (e) {
      if (axios.isCancel(e) || signal.aborted) return
      error.value = e instanceof Error && !axios.isAxiosError(e) ? e.message : toApiError(e).mensagem
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  onMounted(load)
  onScopeDispose(() => controller?.abort())

  return { institutions, statement, totalBalance, loading, error, partial, reload: load }
}
