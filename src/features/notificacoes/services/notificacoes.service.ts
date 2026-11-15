import { http } from '@/lib/api/http'
import { toApiError } from '@/lib/api/types/api-error'
import { mapNotificacoes } from './notificacoes.mapper'
import type {
  AcaoSimplesApiResponse,
  ListaNotificacoesApiResponse,
  Notificacao,
  QuantidadeApiResponse,
} from '../types/notificacoes.types'

const BASE = '/v1/notificacoes'

async function listarNotificacoes(
  idUsuario: number,
  lida?: boolean,
  signal?: AbortSignal,
): Promise<Notificacao[]> {
  try {
    const { data } = await http.get<ListaNotificacoesApiResponse>(
      `${BASE}/usuarios/${idUsuario}/notificacoes`,
      {
        params: lida === undefined ? undefined : { lida: lida ? '1' : '0' },
        signal,
      },
    )
    return mapNotificacoes(data.notificacoes)
  } catch (error) {
    throw toApiError(error)
  }
}

async function contarNaoLidas(idUsuario: number): Promise<number> {
  try {
    const { data } = await http.get<QuantidadeApiResponse>(
      `${BASE}/usuarios/${idUsuario}/notificacoes/nao-lidas`,
    )
    return data.quantidade
  } catch (error) {
    throw toApiError(error)
  }
}

async function marcarComoLida(idNotificacao: number): Promise<void> {
  try {
    await http.patch<AcaoSimplesApiResponse>(`${BASE}/notificacoes/${idNotificacao}/lida`)
  } catch (error) {
    throw toApiError(error)
  }
}

async function marcarTodasComoLidas(idUsuario: number): Promise<number> {
  try {
    const { data } = await http.patch<QuantidadeApiResponse>(
      `${BASE}/usuarios/${idUsuario}/notificacoes/lidas`,
    )
    return data.quantidade
  } catch (error) {
    throw toApiError(error)
  }
}

async function deletarNotificacao(idNotificacao: number): Promise<void> {
  try {
    await http.delete<AcaoSimplesApiResponse>(`${BASE}/notificacoes/${idNotificacao}`)
  } catch (error) {
    throw toApiError(error)
  }
}

export const notificacoesService = {
  listarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  deletarNotificacao,
}
