/**
 * CONTRATO ASSUMIDO DO BACKEND (confirmar com o controller):
 *
 * GET /v1/openfinance/financeiro/contas/:itemId
 *   → { sucesso, contas: [{ id, type: 'BANK'|'CREDIT', subtype, name, number, balance, currencyCode,
 *                           bankData?: { transferNumber } }] }
 *
 * GET /v1/openfinance/financeiro/transacoes/:itemId
 *   → { sucesso, transacoes: [{ id, description, amount, date, type: 'DEBIT'|'CREDIT', category }] }
 *
 * Os campos seguem o formato do Pluggy. Se o backend traduz/renomeia, ajuste só accounts.mapper.ts.
 */

export interface BankAccount {
  id: string
  kind: 'bank' | 'credit'
  name: string
  /** "Ag 0001 • CC 12849-2" quando possível; senão o número cru. */
  numberLabel: string | null
  balance: number
}

export interface Institution {
  itemId: string
  name: string
  logoUrl: string | null
  /** ISO da última sincronização (se o backend informar). */
  updatedAt: string | null
  accountLabel: string | null
  /** Soma das contas correntes/poupança (cartões de crédito ficam de fora). */
  balance: number
  /** Cor do segmento na barra de saldo consolidado. */
  color: string
}

export type StatementIcon = 'shopping' | 'transfer-in' | 'utilities' | 'food' | 'generic'

export interface StatementEntry {
  id: string
  description: string
  /** Negativo = saída, positivo = entrada. */
  amount: number
  date: string
  timestamp: number
  institutionId: string
  institutionName: string
  icon: StatementIcon
}
