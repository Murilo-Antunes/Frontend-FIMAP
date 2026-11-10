import type { BandeiraCartao, TemaCartao } from '../types/cards.types'
import { normalizar } from './format'

export interface TemaVisual {
  fundo: string
  texto: string
}

const TEMAS: Record<TemaCartao, TemaVisual> = {
  black: {
    fundo: 'linear-gradient(135deg, #0a0a0a 0%, #151515 55%, #242424 100%)',
    texto: '#ffffff',
  },
  laranja: {
    fundo: 'linear-gradient(135deg, #d9740d 0%, #c2610a 55%, #a94f06 100%)',
    texto: '#ffffff',
  },
  vermelho: {
    fundo: 'linear-gradient(135deg, #e5533d 0%, #d44530 55%, #b9372a 100%)',
    texto: '#ffffff',
  },
  azul: {
    fundo: 'linear-gradient(135deg, #2f6df0 0%, #2456c8 55%, #1c3f9a 100%)',
    texto: '#ffffff',
  },
  verde: {
    fundo: 'linear-gradient(135deg, #12a174 0%, #0d8a62 55%, #0a6f50 100%)',
    texto: '#ffffff',
  },
  roxo: {
    fundo: 'linear-gradient(135deg, #7c4ee8 0%, #6a3fd0 55%, #532fa8 100%)',
    texto: '#ffffff',
  },
}

export function resolverTema(tema: TemaCartao): TemaVisual {
  return TEMAS[tema] ?? TEMAS.black
}

/** Cores usadas quando o nome do cartão não sugere um tema. */
const CICLO: TemaCartao[] = ['laranja', 'vermelho', 'azul', 'verde', 'roxo']

/**
 * O backend não informa tema, então ele é derivado do nome do produto
 * (ex.: "Mastercard Black" → preto) e, na falta de pista, alterna cores pela
 * posição na lista para os cartões ficarem distinguíveis na carteira.
 */
export function derivarTema(nome: string, indice: number): TemaCartao {
  const n = normalizar(nome)
  if (n.includes('black')) return 'black'
  if (n.includes('platinum') || n.includes('platina')) return 'azul'
  if (n.includes('gold') || n.includes('ouro')) return 'laranja'
  return CICLO[indice % CICLO.length]
}

function identificarBandeira(texto: string): BandeiraCartao | null {
  const t = normalizar(texto)
  if (t.includes('master')) return 'mastercard'
  if (t.includes('visa')) return 'visa'
  if (/\belo\b/.test(t)) return 'elo'
  if (t.includes('amex') || t.includes('american')) return 'amex'
  return null
}

/** Usa o `brand` do Pluggy quando o backend mandar; senão tenta pelo nome do cartão. */
export function derivarBandeira(brand: string | null | undefined, nome: string): BandeiraCartao {
  return (brand ? identificarBandeira(brand) : null) ?? identificarBandeira(nome) ?? 'outra'
}
