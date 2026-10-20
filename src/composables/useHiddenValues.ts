import { useStorage } from '@vueuse/core'

const MASK = '••••••'

// Fora da função de propósito: todas as telas compartilham a mesma preferência.
// É apenas uma preferência visual (não é dado sensível), então o localStorage é adequado.
const hidden = useStorage('fimap:hide-values', false)

/** Controla a exibição dos valores monetários ("olho" do dashboard). */
export function useHiddenValues() {
  const mask = (text: string): string => (hidden.value ? MASK : text)
  const toggle = () => {
    hidden.value = !hidden.value
  }
  return { hidden, mask, toggle }
}
