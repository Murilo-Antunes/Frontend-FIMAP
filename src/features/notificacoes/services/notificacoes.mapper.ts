import type { Notificacao, NotificacaoApi } from '../types/notificacoes.types'

export function mapNotificacao(raw: NotificacaoApi): Notificacao {
  return {
    id: raw.id,
    icone: raw.icone,
    nome: raw.nome,
    conteudo: raw.conteudo,
    dataCriacao: raw.data_criacao,
    lida: Number(raw.lida) === 1,
    idReferencia: raw.id_referencia ?? null,
    tipoReferencia: raw.tipo_referencia ?? null,
  }
}

export function mapNotificacoes(raw: NotificacaoApi[]): Notificacao[] {
  return raw.map(mapNotificacao)
}
