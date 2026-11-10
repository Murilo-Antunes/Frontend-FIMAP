import axios from 'axios'
import { toApiError } from '@/lib/api/types/api-error'

interface CorpoDeErro {
  erro?: unknown
  mensagem?: unknown
}

/**
 * O backend de cartões responde erros como `{ erro: "..." }` (e não como
 * `{ codigo, mensagem }`), então lemos `erro` primeiro e caímos no
 * `toApiError` padrão do projeto para o resto (rede, timeout...).
 */
export function mensagemDeErro(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const corpo = e.response?.data as CorpoDeErro | undefined
    if (typeof corpo?.erro === 'string' && corpo.erro) return corpo.erro
    if (typeof corpo?.mensagem === 'string' && corpo.mensagem) return corpo.mensagem
  }
  if (e instanceof Error && e.name === 'ErroSincronizacao') return e.message
  return toApiError(e).mensagem
}
