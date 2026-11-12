import { isAxiosError } from 'axios'

import { http } from '@/lib/api/http'
import type {
  SettingsGetResponse,
  SettingsWriteResponse,
  UserSettings,
  UserSettingsPayload,
  UserSettingsRow,
} from '../types/settings.types'

/**
 * ATENÇÃO: o caminho abaixo ainda precisa ser confirmado com o roteador do backend
 * (o controller de configurações foi enviado, mas não o arquivo de rotas).
 * Assumido: GET | POST | PATCH  /v1/openfinance/configuracoes/:idUsuario
 */
const BASE = '/v1/configuracoes'

const toBool = (value: number | boolean): boolean => Boolean(Number(value))

function fromRow(row: UserSettingsRow): UserSettings {
  return {
    notificacao: toBool(row.notificacao),
    alerta: toBool(row.alerta),
    relatorio: toBool(row.relatorio),
    recomendacao: toBool(row.recomendacao),
    topicos: toBool(row.topicos),
  }
}

/**
 * O UPDATE do backend grava as 5 colunas de uma vez e usa 0 como default para o que faltar.
 * Por isso o PATCH SEMPRE envia o objeto completo, nunca apenas o campo alterado.
 */
function toPayload(settings: UserSettings): UserSettingsPayload {
  return {
    notificacao: settings.notificacao ? 1 : 0,
    alerta: settings.alerta ? 1 : 0,
    relatorio: settings.relatorio ? 1 : 0,
    recomendacao: settings.recomendacao ? 1 : 0,
    topicos: settings.topicos ? 1 : 0,
  }
}

export const settingsService = {
  /** Retorna `null` quando o usuário ainda não tem configurações (404 do backend). */
  async get(idUsuario: number): Promise<UserSettings | null> {
    try {
      const { data } = await http.get<SettingsGetResponse>(`${BASE}/${idUsuario}`)
      const row = data.configuracoes?.[0]
      return row ? fromRow(row) : null
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null
      throw error
    }
  },

  /** Cria a linha de configurações (409 se já existir). */
  async create(idUsuario: number, settings: UserSettings): Promise<void> {
    await http.post<SettingsWriteResponse>(`${BASE}/${idUsuario}`, toPayload(settings))
  },

  /** Atualiza as configurações (objeto completo, ver `toPayload`). */
  async update(idUsuario: number, settings: UserSettings): Promise<void> {
    await http.patch<SettingsWriteResponse>(`${BASE}/${idUsuario}`, toPayload(settings))
  },
}
