import { financeHttp } from '@/lib/api/finance-http'
import type {
  BankConnection,
  BankConnectionsResponse,
  ConnectTokenResponse,
} from '../types/connection.types'

const BASE = '/v1/openfinance'

/**
 * Comunicação com a API financeira para conectar bancos.
 * Hoje a API não tem autenticação, então o usuário é identificado por `clientUserId` (o id do
 * usuário logado). Quando houver autenticação, o backend passa a ler o usuário da sessão e esse
 * parâmetro deixa de ser enviado.
 */
export const connectionService = {
  /** Token de curta duração que autoriza o widget do Pluggy a abrir para ESTE usuário. */
  async createConnectToken(clientUserId: number | string): Promise<string> {
    const { data } = await financeHttp.post<ConnectTokenResponse>(`${BASE}/connect-token`, {
      clientUserId: String(clientUserId),
    })
    if (!data?.accessToken) {
      throw new Error('A API não retornou o token de conexão.')
    }
    return data.accessToken
  },

  /**
   * Registra o item criado no widget. O backend deve confirmar no Pluggy que o item pertence a
   * `clientUserId` antes de salvar (nunca confiar só no que o navegador envia).
   */
  async saveConnection(clientUserId: number | string, itemId: string): Promise<BankConnection> {
    const { data } = await financeHttp.post<BankConnection>(`${BASE}/conexoes`, {
      clientUserId: String(clientUserId),
      itemId,
    })
    return data
  },

  /** Conexões do usuário. Lista vazia = ainda não conectou nenhuma conta. */
  async listConnections(clientUserId: number | string): Promise<BankConnection[]> {
    const { data } = await financeHttp.get<BankConnectionsResponse>(`${BASE}/conexoes`, {
      params: { clientUserId: String(clientUserId) },
    })
    return data.conexoes ?? []
  },
}
