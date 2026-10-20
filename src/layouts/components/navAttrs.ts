import type { NavItem } from '@/config/navigation'

/** Atributos de um item de navegação: link real quando há rota, botão inativo caso contrário. */
export function navAttrs(item: NavItem): Record<string, unknown> {
  return item.to
    ? { to: item.to }
    : { type: 'button', 'aria-disabled': 'true', title: 'Em breve' }
}
