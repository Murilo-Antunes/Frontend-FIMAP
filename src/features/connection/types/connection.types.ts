/**
 * Contrato da API financeira para conexões bancárias.
 */

export interface ConnectTokenResponse {
  accessToken: string
}

/** Payload para criar uma nova conexão bancária. */
export interface CreateConnectionPayload {
  consentimento_api: string
  ultima_sincronizacao: string
  provedor: string
  external_connection_id: string
  status: boolean
}

/** Conexão (item do Pluggy) vinculada a um usuário. */
export interface BankConnection {
  id: string | number
  consentimento_api: string
  ultima_sincronizacao: string
  provedor: string
  external_connection_id: string
  status: boolean
  id_usuario?: number
  /** Nome da instituição, quando a API souber. */
  instituicao?: string | null
}

export interface BankConnectionsResponse {
  total: number
  conexoes: BankConnection[]
}
