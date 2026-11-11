/** Referência mínima de uma conexão bancária para as telas que agregam dados por itemId. */
export interface ConnectionRef {
  itemId: string
  institutionName: string
  logoUrl: string | null
  /** ISO da última sincronização, quando o backend informa. */
  updatedAt: string | null
}
