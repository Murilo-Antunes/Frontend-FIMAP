import { http } from '@/lib/api/http'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import type { Chat, ChatEvent, ChatMessage, ChatResponse } from '../types/chat.types'
import { readChatStream } from './chat-stream'

const BASE = '/v1/ia/chat'

function requireSuccess<T extends { sucesso: boolean; mensagem: string }>(data: T): T {
  if (!data.sucesso) throw new Error(data.mensagem)
  return data
}

function requireUserId(): number {
  const id = useAuthStore().usuario?.id
  if (!id) throw new Error('Sessão inválida: usuário não identificado.')
  return id
}

export const chatService = {
  async list(signal?: AbortSignal): Promise<Chat[]> {
    const idUsuario = requireUserId()
    const { data } = await http.get<ChatResponse<Chat[]>>(`${BASE}/listar-chats/${idUsuario}`, { signal })
    return requireSuccess(data).conteudo
  },
  async create(nome: string, signal?: AbortSignal): Promise<Chat> {
    const idUsuario = requireUserId()
    const { data } = await http.post<{ sucesso: boolean; mensagem: string; id: number; nome: string }>(
      `${BASE}/iniciar-chat/${idUsuario}`, { nome }, { signal },
    )
    requireSuccess(data)
    const { data: detail } = await http.get<ChatResponse<Chat>>(`${BASE}/listar-chat/${data.id}/${idUsuario}`, { signal })
    return requireSuccess(detail).conteudo
  },
  async messages(id: number, signal?: AbortSignal): Promise<ChatMessage[]> {
    const idUsuario = requireUserId()
    const { data } = await http.get<ChatResponse<ChatMessage[]>>(`${BASE}/listar-chat/${id}/mensagens/${idUsuario}`, { signal })
    return requireSuccess(data).conteudo
  },
  async send(id: number, pergunta: string, onEvent: (event: ChatEvent) => void, signal: AbortSignal) {
    const idUsuario = requireUserId()
    const response = await http.post<ReadableStream<Uint8Array>>(`${BASE}/mensagens`, {
      id_chat: id, id_usuario: idUsuario, pergunta, requisicao_id: crypto.randomUUID(),
    }, { adapter: 'fetch', responseType: 'stream', timeout: 130_000, signal }).catch(async (cause: unknown) => {
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