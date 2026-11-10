import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import type { TransacaoCartao } from '../types/cards.types'
import { interpretarDataHora } from './format'

export interface GrupoTransacoes {
  chave: string
  rotulo: string
  itens: TransacaoCartao[]
}

function rotuloDoDia(dia: string): string {
  const data = dayjs(dia)
  const hoje = dayjs()
  const base = data.locale('pt-br').format('D MMM').replace('.', '').toUpperCase()
  if (data.isSame(hoje, 'day')) return `HOJE, ${base}`
  if (data.isSame(hoje.subtract(1, 'day'), 'day')) return `ONTEM, ${base}`
  return base
}

/** Agrupa por dia (mais recente primeiro), como no histórico do design. */
export function agruparPorDia(transacoes: TransacaoCartao[]): GrupoTransacoes[] {
  const comData = transacoes.filter((t): t is TransacaoCartao & { data: string } => t.data !== null)
  const ordenadas = [...comData].sort((a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf())

  const grupos = new Map<string, GrupoTransacoes>()
  for (const t of ordenadas) {
    const { dia } = interpretarDataHora(t.data)
    const existente = grupos.get(dia)
    if (existente) existente.itens.push(t)
    else grupos.set(dia, { chave: dia, rotulo: rotuloDoDia(dia), itens: [t] })
  }
  return [...grupos.values()]
}

/** Linha de detalhe sob a categoria ("Crédito 1x", "Parcela 2 de 5"...). */
export function descreverTransacao(t: TransacaoCartao): string {
  const base =
    t.tipo === 'CREDITO'
      ? 'Crédito na fatura'
      : t.parcelas
        ? `Parcela ${t.parcelas.numero ?? '?'} de ${t.parcelas.total}`
        : 'Crédito 1x'

  return t.pendente ? `${base} · Pendente` : base
}
