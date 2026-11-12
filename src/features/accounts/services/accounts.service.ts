import { http } from '@/lib/api/http'
import type { ConnectionRef } from '@/features/connection/types/connection-ref'
import type { BankAccount, StatementEntry } from '../types/accounts.types'
import { mapAccounts, mapTransactions } from './accounts.mapper'

const BASE = '/v1/openfinance/financeiro'

export async function fetchAccounts(itemId: string, signal?: AbortSignal): Promise<BankAccount[]> {
  const { data } = await http.get<unknown>(`${BASE}/contas/${encodeURIComponent(itemId)}`, { signal })
  return mapAccounts(data)
}

export async function fetchAllAccounts(itemIds: string[], signal?: AbortSignal): Promise<BankAccount[]> {
  const responses = await Promise.all(itemIds.map((itemId) => fetchAccounts(itemId, signal)))
  return responses.flat()
}

/** Extrato de uma conexão. O consolidado é a união dos extratos de todas as conexões. */
export async function fetchStatement(ref: ConnectionRef, signal?: AbortSignal): Promise<StatementEntry[]> {
  const { data } = await http.get<unknown>(`${BASE}/transacoes/${encodeURIComponent(ref.itemId)}`, { signal })
  return mapTransactions(data, ref)
}

/** Extrato de uma conexão. O consolidado é a união dos extratos de todas as conexões. */
export async function fetchAllStatements(refs: ConnectionRef[], signal?: AbortSignal): Promise<StatementEntry[]> {
  const responses = await Promise.all(refs.map((ref) => fetchStatement(ref, signal)))
  return responses.flat()
}
