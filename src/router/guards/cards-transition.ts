import { nextTick } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'
import '@/features/cards/styles/cards-transition.css'

interface DocumentComViewTransition extends Document {
  startViewTransition?: (atualizar: () => Promise<void> | void) => unknown
}

const ROTAS_DE_CARTAO = new Set(['cards', 'card-detail'])

/** Só anima ao ir entre "Selecionar cartão" e "Detalhe do cartão" (nos dois sentidos). */
function ehTransicaoDeCartao(para: RouteLocationNormalized, de: RouteLocationNormalized): boolean {
  return (
    para.name !== de.name && ROTAS_DE_CARTAO.has(String(para.name)) && ROTAS_DE_CARTAO.has(String(de.name))
  )
}

/**
 * Envolve a navegação em `document.startViewTransition`.
 *
 * Fluxo: o `beforeResolve` captura o estado antigo da tela, libera a navegação,
 * e a transição só é "concluída" depois que o Vue renderizou a nova tela
 * (`afterEach` + `nextTick`), momento em que o navegador captura o estado novo
 * e anima o cartão de uma posição para a outra.
 *
 * Sem suporte à API (ou com "reduzir movimento"), a navegação segue normal.
 *
 * Uso, em src/router/index.ts:  setupCardsTransition(router)
 */
export function setupCardsTransition(router: Router): void {
  if (typeof document === 'undefined') return
  const doc = document as DocumentComViewTransition
  if (typeof doc.startViewTransition !== 'function') return

  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)')
  let concluir: (() => void) | null = null

  const liberar = (): void => {
    concluir?.()
    concluir = null
  }

  router.beforeResolve((para, de) => {
    if (reduzirMovimento.matches || !ehTransicaoDeCartao(para, de)) return undefined

    return new Promise<void>((resolve) => {
      doc.startViewTransition?.(() => {
        resolve()
        return new Promise<void>((pronto) => {
          concluir = pronto
          // Rede de segurança: navegação cancelada não pode travar a renderização.
          window.setTimeout(() => {
            if (concluir === pronto) liberar()
          }, 1500)
        })
      })
    })
  })

  // Roda também em navegação cancelada/com falha, o que libera a transição.
  router.afterEach(() => {
    if (concluir) void nextTick(liberar)
  })
}
