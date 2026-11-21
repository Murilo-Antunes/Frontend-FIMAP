/**
 * Formatação "à prova de API esquisita": nunca deixa a tela mostrar
 * "Invalid Date" ou quebrar por causa de campo nulo/ausente/mal formatado.
 * Use isso em qualquer lugar que formata data/número vindo da API.
 */

export function formatarDataSegura(
  valor: string | null | undefined,
  opcoes: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' },
): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR', opcoes)
}

export function numeroSeguro(valor: unknown, fallback = 0): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : fallback
}
