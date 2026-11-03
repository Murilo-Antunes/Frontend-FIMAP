import { http } from '@/lib/api/http'
import type {
  BankConnection,
  BankConnectionsResponse,
  ConnectTokenResponse,
  CreateConnectionPayload,
} from '../types/connection.types'

const BASE = '/v1/openfinance'

/**
 * Formata a data no formato YYYY-MM-DD HH:mm:ss
 */
function formatarDataSincronizacao(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  const horas = String(data.getHours()).padStart(2, '0')
  const minutos = String(data.getMinutes()).padStart(2, '0')
  const segundos = String(data.getSeconds()).padStart(2, '0')
  
  return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`
}

/**
 * Comunicação com a API financeira para conectar bancos.
 */
export const connectionService = {
  /** Token de curta duração que autoriza o widget do Pluggy a abrir para ESTE usuário. */
  async createConnectToken(clientUserId: number | string): Promise<string> {
    const { data } = await http.post<ConnectTokenResponse>(`${BASE}/connect-token`, {
      clientUserId: String(clientUserId),
    })
    if (!data?.accessToken) {
      throw new Error('A API não retornou o token de conexão.')
    }
    return data.accessToken
  },

  /**
   * Registra o item criado no widget no endpoint /conexoes/:idUsuario
   * O backend deve confirmar no Pluggy que o item pertence a este usuário antes de salvar.
   */
  async saveConnection(
    idUsuario: number,
    consentimentoApi: string,
    externalConnectionId: string,
  ): Promise<BankConnection> {
    const payload: CreateConnectionPayload = {
      consentimento_api: consentimentoApi,
      ultima_sincronizacao: formatarDataSincronizacao(new Date()),
      provedor: 'pluggy',
      external_connection_id: externalConnectionId,
      status: true,
    }
    
    const { data } = await http.post<BankConnection>(`${BASE}/conexoes/${idUsuario}`, payload)
    return data
  },

  /** Conexões do usuário em GET /conexoes/:idUsuario. Lista vazia = ainda não conectou nenhuma conta. */
  async listConnections(idUsuario: number): Promise<BankConnection[]> {
    
    const { data } = await http.get<BankConnectionsResponse>(`${BASE}/conexoes/${idUsuario}`)
    
    const conexoes = data.conexoes ?? []
    
    return conexoes
  },
}
