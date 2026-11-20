/**
 * ⚠️ Mapeamento placeholder: hoje tbl_usuario só guarda "nivel_total" (inteiro).
 * Os títulos ("Estrategista", "Mentor Alpha" etc.) não existem no banco — são
 * só texto no front por enquanto. Se quiser que isso seja administrável,
 * dá pra criar uma tbl_nivel (nivel INT, titulo VARCHAR) e eu troco essa
 * função por uma chamada de API.
 */
const TITULOS_NIVEL: Record<number, string> = {
  1: 'Iniciante',
  2: 'Aprendiz',
  3: 'Estrategista',
  4: 'Mentor Alpha',
  5: 'Lenda Fimap',
}

export function tituloNivel(nivel: number): string {
  return TITULOS_NIVEL[nivel] ?? `Nível ${nivel}`
}

/**
 * Cada nível = 100 XP, mesma regra usada no trigger
 * trg_apos_conquista_badge (nivel_total = FLOOR(xp_usuario / 100) + 1).
 */
export function xpParaProximoNivel(nivelAtual: number): number {
  return nivelAtual * 100
}

export function percentualNivel(xpAtual: number, nivelAtual: number): number {
  const xpBaseNivel = (nivelAtual - 1) * 100
  const xpNoNivel = xpAtual - xpBaseNivel
  return Math.max(0, Math.min(100, Math.round((xpNoNivel / 100) * 100)))
}
