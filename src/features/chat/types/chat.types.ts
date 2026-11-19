export interface Chat {
  id: number
  nome: string
  data_criacao: string
}

export interface ChatMessage {
  id?: number
  conteudo: string
  papel: 0 | 1
  data_envio?: string
}

export interface ChatResponse<T> {
  sucesso: boolean
  mensagem: string
  conteudo: T
}

export type ChatEvent =
  | { tipo: 'trecho'; conteudo: string }
  | { tipo: 'fim'; id_chat: number }
  | { tipo: 'erro'; codigo: string; mensagem: string }
