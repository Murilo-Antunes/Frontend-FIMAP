import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

/** "Hoje, 14:22" | "Ontem, 19:40" | "24 Mai, 21:15" */
export function formatTransactionDate(iso: string): string {
  const date = dayjs(iso)
  const now = dayjs()

  if (date.isSame(now, 'day')) return `Hoje, ${date.format('HH:mm')}`
  if (date.isSame(now.subtract(1, 'day'), 'day')) return `Ontem, ${date.format('HH:mm')}`

  const [day, month] = date.format('DD MMM').split(' ')
  const capitalized = month ? month.charAt(0).toUpperCase() + month.slice(1) : ''
  return `${day} ${capitalized}, ${date.format('HH:mm')}`
}
