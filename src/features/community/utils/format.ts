import dayjs from 'dayjs'
import type { ConteudoItem, PostAutor } from '../types/community.types'

/** "agora", "há 12min", "há 4h", "há 3d" ou a data completa depois de 7 dias. */
export function formatRelativeShort(iso: string | null | undefined): string {
  if (!iso) return ''

  const date = dayjs(iso)
  if (!date.isValid()) return ''

  const minutes = dayjs().diff(date, 'minute')
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`

  return date.format('DD/MM/YYYY')
}

export function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = dayjs(iso)
  return date.isValid() ? date.format('DD/MM/YYYY [às] HH:mm') : ''
}

/** True quando o post foi editado de fato (ignora a diferença de segundos do INSERT). */
export function wasEdited(created: string | null | undefined, updated: string | null | undefined): boolean {
  if (!created || !updated) return false
  return dayjs(updated).diff(dayjs(created), 'second') > 60
}

export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export function authorName(autor: PostAutor | null | undefined): string {
  return autor?.nome_exibicao?.trim() || 'Usuário Fimap'
}

export function authorHandle(autor: PostAutor | null | undefined): string {
  const username = autor?.username_social?.trim()
  return username ? `@${username}` : ''
}

export interface PostContentParts {
  text: string
  media: ConteudoItem[]
}

/** Separa o array `conteudo` em texto corrido e mídias (fotos/vídeos), mantendo a ordem. */
export function splitContent(conteudo: ConteudoItem[]): PostContentParts {
  const text = conteudo
    .filter((item) => item.tipo === 'texto')
    .map((item) => item.valor.trim())
    .filter(Boolean)
    .join('\n\n')

  const media = conteudo.filter((item) => item.tipo === 'foto' || item.tipo === 'video')

  return { text, media }
}
