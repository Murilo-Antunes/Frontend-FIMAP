import type { BandeiraCartao, TemaCartao } from '../types/cards.types'
import { normalizar } from './format'

export interface TemaVisual {
  fundo: string
  texto: string
  /** Cor do chip EMV */
  chip: string
  /** Orb principal (topo-direita) */
  orb1: string
  /** Orb secundário (baixo-esquerda) */
  orb2: string
  /** Brilho/sheen direcional */
  sheen: string
  /** Texto escuro (para o tema claro) */
  escuro: boolean
}

const TEMAS: Record<TemaCartao, TemaVisual> = {
  /** ── Preto ── detalhes acinzentados, brilho sutil prata */
  black: {
    fundo: 'linear-gradient(145deg, #111111 0%, #1a1a1a 50%, #0d0d0d 100%)',
    texto: '#ffffff',
    chip: 'linear-gradient(135deg, #c8c8c8 0%, #e8e8e8 50%, #b0b0b0 100%)',
    orb1: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
    escuro: false,
  },
  /** ── Branco/pérola ── detalhes dourado-champanhe, texto escuro */
  branco: {
    fundo: 'linear-gradient(145deg, #f5f5f0 0%, #ebebe5 50%, #f0f0eb 100%)',
    texto: '#1a1a1a',
    chip: 'linear-gradient(135deg, #c9a84c 0%, #e8c96a 50%, #b8952e 100%)',
    orb1: 'radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(180,160,100,0.12) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 45%, rgba(200,180,120,0.1) 100%)',
    escuro: true,
  },
  /** ── Roxo-índigo ── orbs violeta, brilho azulado */
  roxo: {
    fundo: 'linear-gradient(145deg, #4a3bc4 0%, #5b4bdb 45%, #3d2fa8 100%)',
    texto: '#ffffff',
    chip: 'linear-gradient(135deg, #fde68a 0%, #f5b82e 55%, #e89a0c 100%)',
    orb1: 'radial-gradient(circle, rgba(180,160,255,0.2) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(100,80,220,0.3) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(100,80,220,0.08) 100%)',
    escuro: false,
  },
  /** Mantidos para compatibilidade com temas derivados por nome */
  laranja: {
    fundo: 'linear-gradient(145deg, #d9740d 0%, #c2610a 50%, #a94f06 100%)',
    texto: '#ffffff',
    chip: 'linear-gradient(135deg, #fde68a 0%, #f5b82e 55%, #e89a0c 100%)',
    orb1: 'radial-gradient(circle, rgba(255,220,100,0.18) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(255,160,50,0.15) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,160,50,0.08) 100%)',
    escuro: false,
  },
  vermelho: {
    fundo: 'linear-gradient(145deg, #e5533d 0%, #d44530 50%, #b9372a 100%)',
    texto: '#ffffff',
    chip: 'linear-gradient(135deg, #fde68a 0%, #f5b82e 55%, #e89a0c 100%)',
    orb1: 'radial-gradient(circle, rgba(255,180,160,0.18) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(220,80,60,0.2) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(220,80,60,0.08) 100%)',
    escuro: false,
  },
  azul: {
    fundo: 'linear-gradient(145deg, #2f6df0 0%, #2456c8 50%, #1c3f9a 100%)',
    texto: '#ffffff',
    chip: 'linear-gradient(135deg, #fde68a 0%, #f5b82e 55%, #e89a0c 100%)',
    orb1: 'radial-gradient(circle, rgba(150,200,255,0.18) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(50,100,220,0.2) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(50,100,220,0.08) 100%)',
    escuro: false,
  },
  verde: {
    fundo: 'linear-gradient(145deg, #12a174 0%, #0d8a62 50%, #0a6f50 100%)',
    texto: '#ffffff',
    chip: 'linear-gradient(135deg, #fde68a 0%, #f5b82e 55%, #e89a0c 100%)',
    orb1: 'radial-gradient(circle, rgba(100,255,180,0.15) 0%, transparent 65%)',
    orb2: 'radial-gradient(circle, rgba(20,160,100,0.2) 0%, transparent 60%)',
    sheen: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(20,160,100,0.08) 100%)',
    escuro: false,
  },
}

export function resolverTema(tema: TemaCartao): TemaVisual {
  return TEMAS[tema] ?? TEMAS.black
}

/**
 * Ciclo de 3 cores pela posição do cartão na lista.
 * Ordem: preto → branco → roxo → preto → …
 * O nome do cartão não influencia — garante contraste sempre.
 */
const CICLO: TemaCartao[] = ['black', 'branco', 'roxo']

export function derivarTema(_nome: string, indice: number): TemaCartao {
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
