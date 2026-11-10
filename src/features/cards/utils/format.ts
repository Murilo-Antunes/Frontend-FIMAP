import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
/** Sem centavos quando o valor é inteiro (ex.: "R$ 1.536"). */
const moedaEnxuta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const formatarMoeda = (valor: number): string => moeda.format(valor)
export const formatarMoedaEnxuta = (valor: number): string => moedaEnxuta.format(valor)

export function formatarPercentual(valor: number): string {
  return `${Math.round(valor)}%`
}

export function percentual(parte: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, (parte / total) * 100))
}

const capitalizar = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1)

/** "2026-11-02" → "2 de Novembro". Sem data → "—". */
export function formatarVencimento(iso: string | null): string {
  if (!iso) return '—'
  const data = dayjs(iso.slice(0, 10)).locale('pt-br')
  return `${data.format('D')} de ${capitalizar(data.format('MMMM'))}`
}

/** "2026-11-02" → "02/11" */
export function formatarDiaMes(iso: string | null): string {
  if (!iso) return ''
  return dayjs(iso.slice(0, 10)).format('DD/MM')
}

export interface DataHora {
  /** YYYY-MM-DD */
  dia: string
  /** HH:mm, ou null quando o backend só informou a data. */
  hora: string | null
}

const MEIA_NOITE_UTC = /T00:00:00(?:\.0+)?(?:Z|\+00:00)$/

/**
 * O Pluggy costuma mandar só a data, como meia-noite UTC. Converter isso para
 * o fuso do navegador empurraria a compra para o dia anterior (21:00 de ontem
 * em Brasília) e mostraria uma hora que não existe. Nesse caso usamos o dia
 * como veio e omitimos a hora.
 */
export function interpretarDataHora(iso: string): DataHora {
  if (MEIA_NOITE_UTC.test(iso)) return { dia: iso.slice(0, 10), hora: null }

  const data = dayjs(iso)
  return { dia: data.format('YYYY-MM-DD'), hora: data.format('HH:mm') }
}

/** Remove acentos e baixa caixa, para comparar nomes de categoria. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
