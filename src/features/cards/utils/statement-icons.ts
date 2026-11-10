import {
  ArrowDown,
  Car,
  Clapperboard,
  Fuel,
  MonitorPlay,
  Pill,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import type { LancamentoExtrato } from '../types/cards-statement.types'

/** Slugs enviados pela API em `lancamento.icone`. */
const ICONES_POR_SLUG: Record<string, Component> = {
  supermercado: ShoppingCart,
  restaurante: Utensils,
  transporte: Car,
  combustivel: Fuel,
  assinatura: MonitorPlay,
  streaming: Clapperboard,
  farmacia: Pill,
  vestuario: Shirt,
}

/** Fallback quando a API não manda `icone`: casa pelo começo do nome da categoria. */
const ICONES_POR_CATEGORIA: ReadonlyArray<readonly [string, Component]> = [
  ['alimenta', Utensils],
  ['transporte', Car],
  ['assinatura', MonitorPlay],
  ['farm', Pill],
  ['compras', ShoppingBag],
]

export function iconeLancamento(lancamento: LancamentoExtrato): Component {
  if (lancamento.tipo === 'pagamento') return ArrowDown

  if (lancamento.icone) {
    const porSlug = ICONES_POR_SLUG[lancamento.icone]
    if (porSlug) return porSlug
  }

  const categoria = lancamento.categoria
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return ICONES_POR_CATEGORIA.find(([prefixo]) => categoria.startsWith(prefixo))?.[1] ?? Receipt
}
