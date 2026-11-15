/**
 * Tipos da feature de Notificações.
 *
 * `tipo_referencia` / `id_referencia` ainda NÃO existem no backend atual.
 * São uma recomendação para viabilizar o redirecionamento futuro ao post/
 * entidade referenciada pela notificação — ver aviso enviado junto a este
 * pacote. O front já é escrito como se os campos existissem (nullable).
 */

export type TipoReferenciaNotificacao = 'post' | 'comentario' | 'meta' | 'oportunidade'

export interface NotificacaoApi {
  id: number
  icone: string
  nome: string
  conteudo: string
  data_criacao: string
  lida: number
  id_referencia?: number | null
  tipo_referencia?: TipoReferenciaNotificacao | null
}

export interface Notificacao {
  id: number
  icone: string
  nome: string
  conteudo: string
  dataCriacao: string
  lida: boolean
  idReferencia: number | null
  tipoReferencia: TipoReferenciaNotificacao | null
}

export type FiltroNotificacao = 'todas' | 'nao-lidas' | 'lidas'

export interface ListaNotificacoesApiResponse {
  sucesso: boolean
  mensagem: string
  quantidade: number
  notificacoes: NotificacaoApi[]
}

export interface QuantidadeApiResponse {
  sucesso: boolean
  mensagem: string
  quantidade: number
}

export interface AcaoSimplesApiResponse {
  sucesso: boolean
  mensagem: string
}
