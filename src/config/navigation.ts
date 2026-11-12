import type { Component } from 'vue'
import {
  Bot,
  Calculator,
  CreditCard,
  Flag,
  HandCoins,
  Home,
  Landmark,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-vue-next'

export const SIDEBAR_ID = 'app-sidebar'

export interface NavItem {
  key: string
  label: string
  icon: Component
  /**
   * Rota da tela. Itens sem `to` ainda não têm tela: aparecem na interface,
   * mas não navegam. Quando a tela existir, basta preencher `to`.
   */
  to?: string
  description?: string
  highlight?: boolean
  badge?: string
}

/** Abas do header (e atalhos do menu lateral em telas pequenas). */
export const MAIN_NAV: NavItem[] = [
  { key: 'home', label: 'Início', icon: Home, to: '/dashboard' },
  { key: 'chat', label: 'Chat IA', icon: Bot },
  { key: 'simulator', label: 'Simular', icon: Calculator },
  { key: 'goals', label: 'Metas', icon: Flag },
  { key: 'community', label: 'Social', icon: Users },
]

/** Itens do menu lateral ("Navegação principal"). */
export const SIDEBAR_NAV: NavItem[] = [
  { key: 'cards', 
    label: 'Carteira de Cartões', 
    icon: CreditCard, 
    description: 'Limites e extratos', 
    to: '/cartoes' 
  },
  {
    key: 'accounts',
    label: 'Contas Bancárias',
    icon: Landmark,
    description: 'Contas conectadas via Open Finance',
    to: "/contas"
  },
  { key: 'investments', 
    label: 'Investimentos', 
    icon: TrendingUp, 
    description: 'Carteira e rentabilidade', 
    to: "/investimentos" 
  },
  { key: 'loans', 
    label: 'Empréstimos', 
    icon: HandCoins, 
    description: 'Contratos e parcelas', 
    to: '/emprestimos' 
  },
  { key: 'settings', 
    label: 'Configurações', 
    icon: Settings, 
    description: 'Personalize sua experiência',
    to: '/configuracoes'
  },
  {
    key: 'opportunities',
    label: 'Histórico de Oportunidades',
    icon: Sparkles,
    description: 'Insights de economia gerados',
    highlight: true,
    badge: 'IA',
  },
]
