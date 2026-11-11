import { asNumber, asString, extractList, isRecord, type RawRecord } from '@/lib/api/extract'
import type { ConnectionRef } from '@/features/connection/types/connection-ref'
import type { BankAccount, Institution, StatementEntry, StatementIcon } from '../types/accounts.types'

/** Primeiras cores seguem o design (roxo, preto, cinza); as demais cobrem bancos extras. */
const SEGMENT_COLORS = ['#5B4BDB', '#0A0A0A', '#D4D4D4', '#10B981', '#F59E0B', '#EC4899']

export function segmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length]
}

function accountNumberLabel(raw: RawRecord): string | null {
  const bankData = isRecord(raw.bankData) ? raw.bankData : null
  const transfer = bankData ? asString(bankData.transferNumber) : null
  const source = transfer ?? asString(raw.number)
  if (!source) return null
  const [agency, account] = source.split('/')
  return agency && account ? `Ag ${agency} • CC ${account}` : source
}

export function mapAccounts(data: unknown): BankAccount[] {
  const accounts: BankAccount[] = []
  for (const raw of extractList(data, ['contas', 'accounts', 'results'])) {
    const id = asString(raw.id)
    // Backend responde em português: "saldo", "tipo", "subtipo", "nome" (confirmado em produção).
    const balance = asNumber(raw.saldo) ?? asNumber(raw.balance)
    if (!id || balance === null) continue
    const type = (asString(raw.tipo) ?? asString(raw.type) ?? '').toUpperCase()
    const subtype = (asString(raw.subtipo) ?? asString(raw.subtype) ?? '').toUpperCase()
    accounts.push({
      id,
      kind: type === 'CREDIT' || subtype === 'CREDIT_CARD' ? 'credit' : 'bank',
      name: asString(raw.nome) ?? asString(raw.marketingName) ?? asString(raw.name) ?? 'Conta',
      numberLabel: accountNumberLabel(raw),
      balance,
    })
  }
  return accounts
}

/** Retorna null quando a conexão não tem conta corrente/poupança (ex.: só cartão). */
export function buildInstitution(ref: ConnectionRef, accounts: BankAccount[], colorIndex: number): Institution | null {
  const bankAccounts = accounts.filter((a) => a.kind === 'bank')
  if (bankAccounts.length === 0) return null
  return {
    itemId: ref.itemId,
    name: ref.institutionName,
    logoUrl: ref.logoUrl,
    updatedAt: ref.updatedAt,
    accountLabel: bankAccounts[0].numberLabel,
    balance: bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    color: segmentColor(colorIndex),
  }
}

function resolveIcon(category: string, amount: number): StatementIcon {
  const c = category.toLowerCase()
  if (amount > 0 && (c === '' || c.includes('transfer') || c.includes('income') || c.includes('salary'))) {
    return 'transfer-in'
  }
  if (/(supermarket|grocer|shopping|retail)/.test(c)) return 'shopping'
  if (/(electric|energy|utilit|water|internet|telecom|bill)/.test(c)) return 'utilities'
  if (/(restaurant|food|coffee|eating|bakery)/.test(c)) return 'food'
  return 'generic'
}

export function mapTransactions(data: unknown, ref: ConnectionRef): StatementEntry[] {
  const entries: StatementEntry[] = []
  // NÃO CONFIRMADO: ainda não vi a resposta real de /financeiro/transacoes/:itemId.
  // Por padrão, /contas e /conexoes vieram todo em português ("nome", "saldo", "tipo"), então
  // aceitamos "valor"/"descricao"/"data"/"categoria" como primeira tentativa e o formato
  // em inglês como reserva. Envie uma amostra real para eu confirmar e remover o fallback duplo.
  for (const raw of extractList(data, ['transacoes', 'transactions', 'results'])) {
    const id = asString(raw.id)
    const rawAmount = asNumber(raw.valor) ?? asNumber(raw.amount)
    const date = asString(raw.data) ?? asString(raw.date)
    if (!id || rawAmount === null || !date) continue
    const timestamp = Date.parse(date)
    if (Number.isNaN(timestamp)) continue

    const type = (asString(raw.tipo) ?? asString(raw.type) ?? '').toUpperCase()
    const amount = type === 'DEBIT' ? -Math.abs(rawAmount) : type === 'CREDIT' ? Math.abs(rawAmount) : rawAmount

    entries.push({
      id: `${ref.itemId}:${id}`,
      description: asString(raw.descricao) ?? asString(raw.description) ?? asString(raw.descriptionRaw) ?? 'Transação',
      amount,
      date,
      timestamp,
      institutionId: ref.itemId,
      institutionName: ref.institutionName,
      icon: resolveIcon(asString(raw.categoria) ?? asString(raw.category) ?? '', amount),
    })
  }
  return entries
}
