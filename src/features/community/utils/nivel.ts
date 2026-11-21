import { ref } from 'vue'
import { buscarNiveis } from '../services/profile.service'
import type { NivelInfo } from '../types/profile.types'

// Cache simples em memória (módulo é singleton): evita refazer o GET /niveis
// toda vez que um componente diferente da tela de perfil precisa do título.
const niveis = ref<NivelInfo[]>([])
let carregando: Promise<void> | null = null

export function useNiveis() {
  async function carregarNiveis() {
    if (niveis.value.length) return
    if (!carregando) {
      carregando = buscarNiveis()
        .then((lista) => {
          niveis.value = lista
        })
        .finally(() => {
          carregando = null
        })
    }
    await carregando
  }

  return { niveis, carregarNiveis }
}

export function tituloNivel(lista: NivelInfo[], nivelAtual: number): string {
  return lista.find((n) => n.nivel === nivelAtual)?.titulo ?? `Nível ${nivelAtual}`
}

/** XP necessário para o PRÓXIMO nível (usado na barra de progresso). */
export function xpParaProximoNivel(lista: NivelInfo[], nivelAtual: number): number {
  const proximo = lista.find((n) => n.nivel === nivelAtual + 1)
  return proximo?.xp_necessario ?? Infinity // sem próximo nível cadastrado = já é o máximo
}

export function percentualNivel(xpAtual: number, lista: NivelInfo[], nivelAtual: number): number {
  const base = lista.find((n) => n.nivel === nivelAtual)?.xp_necessario ?? 0
  const alvo = lista.find((n) => n.nivel === nivelAtual + 1)?.xp_necessario

  if (alvo === undefined) return 100 // nível máximo cadastrado

  return Math.max(0, Math.min(100, Math.round(((xpAtual - base) / (alvo - base)) * 100)))
}
