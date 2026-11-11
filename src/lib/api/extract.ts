/**
 * Helpers para ler respostas da API sem usar `any`.
 * Todo mapper deve receber `unknown` e extrair o que precisa por aqui.
 */

export type RawRecord = Record<string, unknown>

export function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Aceita array direto ou objeto com a lista em uma das `keys`. */
export function extractList<T = RawRecord>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[]
  if (isRecord(data)) {
    for (const key of keys) {
      const value = data[key]
      if (Array.isArray(value)) return value as T[]
    }
  }
  return []
}

export function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function pickString(record: RawRecord, keys: string[]): string | null {
  for (const key of keys) {
    const found = asString(record[key])
    if (found) return found
  }
  return null
}
