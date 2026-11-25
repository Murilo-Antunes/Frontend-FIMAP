import type { FinancialAction } from '../schemas/financial-action.schemas'

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
  acoes_financeiras?: FinancialAction[]
}

export interface ChatResponse<T> {
  sucesso: boolean
  mensagem: string
  conteudo: T
}

export type ChatEvent =
  | { tipo: 'trecho'; conteudo: string }
  | { tipo: 'fim'; id_chat: number; mensagem_usuario?: ChatMessage; mensagem_assistente?: ChatMessage; acoes_financeiras?: FinancialAction[] }
  | { tipo: 'erro'; codigo: string; mensagem: string }

export interface ChatRequestStatus {
  sucesso?: boolean
  mensagem?: string
  conteudo?: {
    estado?: 'gerando' | 'concluida' | 'falhou' | 'cancelada' | 'expirada'
    resultado?: { mensagem_usuario?: ChatMessage; mensagem_assistente?: ChatMessage }
  }
  estado?: 'gerando' | 'concluida' | 'falhou' | 'cancelada' | 'expirada'
  resultado?: { mensagem_usuario?: ChatMessage; mensagem_assistente?: ChatMessage }
}
