/**
 * Contrato da API financeira para conexões bancárias.
 * `connect-token` é o endpoint atual; `conexoes` (POST/GET) é a PROPOSTA de contrato que o backend
 * precisa implementar para guardar o itemId do usuário (ver explicação na entrega).
 */

export interface ConnectTokenResponse {
  accessToken: string
}

/** Conexão (item do Pluggy) vinculada a um usuário. */
export interface BankConnection {
  id: string | number
  /** Identificador do item no Pluggy; usado como `itemId` nas consultas financeiras. */
  itemId: string
  /** Nome da instituição, quando a API souber. */
  instituicao: string | null
  status: string | null
}

export interface BankConnectionsResponse {
  conexoes: BankConnection[]
}
