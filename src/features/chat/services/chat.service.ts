import { http } from '@/lib/api/http'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import type { Chat, ChatEvent, ChatMessage, ChatRequestStatus, ChatResponse } from '../types/chat.types'
import { financialActionSchema, parseFinancialActions, type FinancialAction } from '../schemas/financial-action.schemas'
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
    return requireSuccess(data).conteudo.map(message => ({
      ...message,
      acoes_financeiras: message.papel === 1 ? parseFinancialActions(message.acoes_financeiras) : undefined,
    }))
  },
  async confirmFinancialAction(id: number, action: FinancialAction, signal: AbortSignal): Promise<FinancialAction> {
    const { data } = await http.post<ChatResponse<unknown>>(
      `${BASE}/${id}/acoes/${action.id}/confirmar`, { versao: action.versao }, { signal },
    )
    const saved = financialActionSchema.safeParse(requireSuccess(data).conteudo)
    if (!saved.success || saved.data.status !== 'salva' || saved.data.id !== action.id
      || saved.data.versao !== action.versao || saved.data.tipo !== action.tipo) {
      throw new Error('Não foi possível confirmar o salvamento. Tente novamente.')
    }
    return saved.data
  },
  async rename(id: number, nome: string, signal: AbortSignal): Promise<void> {
    const { data } = await http.patch<ChatResponse<unknown>>(
      `${BASE}/atualizar-nome-chat/${id}`, { nome }, { signal },
    )
    requireSuccess(data)
  },
  async remove(id: number, signal: AbortSignal): Promise<void> {
    const { data } = await http.delete<ChatResponse<unknown>>(`${BASE}/apagar-chat/${id}`, { signal })
    requireSuccess(data)
  },
  async requestStatus(requestId: string, signal?: AbortSignal): Promise<ChatRequestStatus> {
    const { data } = await http.get<ChatRequestStatus>(`${BASE}/requisicoes/${encodeURIComponent(requestId)}`, { signal })
    return data
  },
  async cancel(requestId: string, signal?: AbortSignal): Promise<ChatRequestStatus> {
    const { data } = await http.post<ChatRequestStatus>(`${BASE}/requisicoes/${encodeURIComponent(requestId)}/cancelar`, {}, { signal })
    return data
  },
  async send(id: number, pergunta: string, requestId: string, onEvent: (event: ChatEvent) => void, signal: AbortSignal) {
    const idUsuario = requireUserId()
    const response = await http.post<ReadableStream<Uint8Array>>(`${BASE}/mensagens`, {
      id_chat: id, id_usuario: idUsuario, pergunta, requisicao_id: requestId,
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
