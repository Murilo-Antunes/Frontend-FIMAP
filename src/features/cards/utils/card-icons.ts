import type { Component } from 'vue'
import { Car, CircleX, Fuel, Receipt, ShoppingCart } from 'lucide-vue-next'
import { normalizar } from './format'

/**
 * O backend manda só o nome da categoria (pode vir em inglês, vindo do
 * Enriquecimento do Pluggy), então o ícone é escolhido por palavras-chave.
 */
const REGRAS: { palavras: string[]; icone: Component }[] = [
  { palavras: ['combust', 'fuel', 'gas station', 'posto'], icone: Fuel },
  { palavras: ['transport', 'taxi', 'ride', 'travel', 'viagem', 'mobilidade'], icone: Car },
  { palavras: ['subscri', 'assinat', 'streaming', 'servic', 'service'], icone: CircleX },
  { palavras: ['aliment', 'food', 'grocer', 'supermerc', 'mercado', 'restaur', 'eating'], icone: ShoppingCart },
]

export function resolverIconeTransacao(categoria: string): Component {
  const nome = normalizar(categoria)
  return REGRAS.find((r) => r.palavras.some((p) => nome.includes(p)))?.icone ?? Receipt
}
