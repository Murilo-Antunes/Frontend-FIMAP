import { http } from '@/lib/api/http'
import axios from 'axios'
import type { Chat, ChatEvent, ChatMessage, ChatResponse } from '../types/chat.types'
import { readChatStream } from './chat-stream'

const BASE = '/v1/ia/chat'
function requireSuccess<T extends { sucesso: boolean; mensagem: string }>(data: T): T {
  if (!data.sucesso) throw new Error(data.mensagem)
  return data
}

export const chatService = {
  async list(signal?: AbortSignal): Promise<Chat[]> {
    const { data } = await http.get<ChatResponse<Chat[]>>(`${BASE}/listar-chats`, { signal })
    return requireSuccess(data).conteudo
  },
  async create(nome: string, signal?: AbortSignal): Promise<Chat> {
    const { data } = await http.post<{ sucesso: boolean; mensagem: string; id: number; nome: string }>(
      `${BASE}/iniciar-chat`, { nome }, { signal },
    )
    requireSuccess(data)
    // Recarrega a data de criação real retornada pelo backend.
    const { data: detail } = await http.get<ChatResponse<Chat>>(`${BASE}/listar-chat/${data.id}`, { signal })
    return requireSuccess(detail).conteudo
  },
  async messages(id: number, signal?: AbortSignal): Promise<ChatMessage[]> {
    // Contrato pendente no backend: ver README.md desta feature.
    const { data } = await http.get<ChatResponse<ChatMessage[]>>(`${BASE}/listar-chat/${id}/mensagens`, { signal })
    return requireSuccess(data).conteudo
  },
  async send(id: number, pergunta: string, onEvent: (event: ChatEvent) => void, signal: AbortSignal) {
    const response = await http.post<ReadableStream<Uint8Array>>(`${BASE}/mensagens`, {
      id_chat: id, pergunta, requisicao_id: crypto.randomUUID(),
    }, { adapter: 'fetch', responseType: 'stream', timeout: 130_000, signal }).catch(async (cause: unknown) => {
      // O adapter fetch também entrega o corpo de erros HTTP como stream.
      if (axios.isAxiosError(cause) && cause.response?.data instanceof ReadableStream) {
        try { cause.response.data = await new Response(cause.response.data).json() }
        catch { /* O normalizador compartilhado fornece a mensagem padrão. */ }
      }
      throw cause
    })
    if (!String(response.headers['content-type']).includes('text/event-stream')) {
      throw new Error('O servidor não retornou uma resposta válida da IA.')
    }
    await readChatStream(response.data, onEvent)
  },
}
