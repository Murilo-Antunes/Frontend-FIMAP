/** Configurações do usuário, já convertidas para boolean (a API usa 0/1 no MySQL). */
export interface UserSettings {
  /** Notificações push */
  notificacao: boolean
  /** Alertas de vencimento de fatura */
  alerta: boolean
  /** Relatório semanal consolidado */
  relatorio: boolean
  /** Recomendações da IA */
  recomendacao: boolean
  /** Feed & tópicos da comunidade */
  topicos: boolean
}

export type SettingKey = keyof UserSettings

/** Linha crua devolvida por GET /configuracoes/:idUsuario (campos tinyint → 0/1). */
export interface UserSettingsRow {
  id_usuario?: number
  notificacao: number | boolean
  alerta: number | boolean
  relatorio: number | boolean
  recomendacao: number | boolean
  topicos: number | boolean
}

export interface SettingsGetResponse {
  sucesso: boolean
  mensagem: string
  /** O controller devolve o resultado do SELECT, ou seja, um array. */
  configuracoes: UserSettingsRow[]
}

export interface SettingsWriteResponse {
  sucesso: boolean
  mensagem: string
  id?: number
}

/** Payload enviado ao backend (0/1). */
export type UserSettingsPayload = Record<SettingKey, 0 | 1>
