import type { Component } from 'vue'
import * as LucideIcons from 'lucide-vue-next'
import { Bell } from 'lucide-vue-next'

/**
 * Resolve o nome do ícone retornado pelo backend (`icone`, ex.: "Heart",
 * "MessageCircle") para o componente Lucide equivalente. Se o backend
 * mandar um nome que não existe na lib, cai no ícone de sino como padrão
 * em vez de quebrar a tela.
 */
export function resolveNotificationIcon(nomeIcone: string): Component {
  const icone = (LucideIcons as unknown as Record<string, Component>)[nomeIcone]
  return icone ?? Bell
}
