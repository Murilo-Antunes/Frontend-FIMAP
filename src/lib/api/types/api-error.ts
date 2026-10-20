import axios from 'axios'

/** Formato de erro devolvido pela API: { codigo, mensagem, campos? } */
export interface ApiErrorBody {
  codigo: string
  mensagem: string
  campos?: Record<string, string>
}

/** Erro normalizado, independente de ser falha de rede, timeout ou resposta da API. */
export interface ApiError {
  status: number | null
  codigo: string
  mensagem: string
  campos?: Record<string, string>
}

const GENERIC_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.'

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError<Partial<ApiErrorBody>>(error)) {
    if (!error.response) {
      return {
        status: null,
        codigo: 'ERRO_DE_REDE',
        mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      }
    }
    const body = error.response.data
    return {
      status: error.response.status,
      codigo: body?.codigo ?? 'ERRO_DESCONHECIDO',
      mensagem: body?.mensagem ?? GENERIC_MESSAGE,
      campos: body?.campos,
    }
  }
  return { status: null, codigo: 'ERRO_DESCONHECIDO', mensagem: GENERIC_MESSAGE }
}
