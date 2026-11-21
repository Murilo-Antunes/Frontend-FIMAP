/**
 * Estilos compartilhados da comunidade, seguindo as telas de referência:
 * fundo #f9f9f9, cards brancos só com sombra suave (sem borda), botões pretos em pílula,
 * superfícies cinza #f3f3f3 (busca e campo de resposta).
 * Valores fixos (não dependem dos tokens do tema) para não herdar cores diferentes do design.
 */

const SHADOW = 'shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_22px_rgba(0,0,0,0.05)]'
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2'

export const ui = {
  /** Fundo da página */
  page: 'min-h-[calc(100dvh-4rem)] bg-[#f9f9f9]',

  /** Card branco, só sombra */
  card: `rounded-xl bg-white ${SHADOW}`,
  cardHover: 'transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_10px_30px_rgba(0,0,0,0.08)]',

  /** Campo branco (formulário de perfil) */
  field: `rounded-xl bg-white ${SHADOW} transition focus-within:ring-2 focus-within:ring-black/10`,

  /** Campo cinza (busca e resposta) */
  fieldGray:
    'rounded-full bg-[#f3f3f3] text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-[#eeeeee] focus-visible:ring-2 focus-visible:ring-black/10',

  /** Botão principal: preto, pílula */
  btnBlack: `inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`,

  /** Botão secundário: cinza, pílula */
  btnGray: `inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#ebebeb] px-4 text-sm font-medium text-neutral-900 transition hover:bg-[#e2e2e2] disabled:pointer-events-none disabled:opacity-50 ${FOCUS}`,

  /** Textos */
  eyebrow: 'text-[11px] font-medium uppercase tracking-wider text-neutral-500',
  muted: 'text-neutral-500',
} as const
