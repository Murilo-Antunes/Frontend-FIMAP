import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number): string {
  return brl.format(value)
}

/** "+R$ 1.240,80" / "-R$ 342,80". Com `spaced`, "+ R$ 1.250,00" (padrão do extrato). */
export function formatSignedBRL(value: number, spaced = false): string {
  const sign = value < 0 ? '-' : '+'
  return `${sign}${spaced ? ' ' : ''}${brl.format(Math.abs(value))}`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace('.', ',')}%`
}

export function formatSignedPercent(value: number, digits = 1): string {
  return `${value < 0 ? '-' : '+'}${formatPercent(Math.abs(value), digits)}`
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 }).format(value)
}

/** "há 4 minutos". */
export function formatRelative(iso: string | number | Date): string {
  return dayjs(iso).fromNow()
}

/** Diferença em minutos até agora (>= 0). */
export function minutesSince(iso: string | number | Date): number {
  return Math.max(0, dayjs().diff(dayjs(iso), 'minute'))
}

/** "Hoje, 14:20" / "Ontem, 19:40" / "08 nov, 10:15". Sem hora quando a API só informa a data. */
export function formatStatementDate(iso: string): string {
  const hasTime = iso.includes('T') && !/T00:00:00(\.0+)?(Z|[+-]00:?00)?$/.test(iso)
  const d = dayjs(iso)
  const today = dayjs().startOf('day')
  const day = d.startOf('day')
  let label: string
  if (day.isSame(today)) label = 'Hoje'
  else if (day.isSame(today.subtract(1, 'day'))) label = 'Ontem'
  else label = d.format('DD MMM').replace('.', '')
  return hasTime ? `${label}, ${d.format('HH:mm')}` : label
}
