import type { ResultadoApi } from '../types/cards.types'

export class ErroSincronizacao extends Error {
  constructor() {
    super('A sincronização com o banco está demorando mais que o esperado. Tente novamente em instantes.')
    this.name = 'ErroSincronizacao'
  }
}

interface Opcoes {
  signal?: AbortSignal
  /** Chamado a cada vez que o backend responde "atualizando". */
  onSincronizando?: () => void
  intervaloMs?: number
  maxTentativas?: number
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Cancelado', 'AbortError'))

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', aoCancelar)
      resolve()
    }, ms)

    const aoCancelar = (): void => {
      clearTimeout(timer)
      reject(new DOMException('Cancelado', 'AbortError'))
    }
    signal?.addEventListener('abort', aoCancelar, { once: true })
  })
}

/**
 * Repete a chamada enquanto o backend responder 202 (conexão sincronizando).
 * Para quando vierem dados, estourar o limite de tentativas ou o signal abortar.
 */
export async function aguardarSincronizacao<T>(
  buscar: () => Promise<ResultadoApi<T>>,
  { signal, onSincronizando, intervaloMs = 4000, maxTentativas = 15 }: Opcoes = {},
): Promise<T> {
  for (let tentativa = 0; tentativa < maxTentativas; tentativa += 1) {
    const resultado = await buscar()
    if (!resultado.atualizando) return resultado.dados

    onSincronizando?.()
    await esperar(intervaloMs, signal)
  }
  throw new ErroSincronizacao()
}
