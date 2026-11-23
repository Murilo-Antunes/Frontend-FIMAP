import DOMPurify from 'dompurify'
import { Marked, Renderer, type Token, type Tokens } from 'marked'
import { z } from 'zod'

const label = z.string().trim().min(1).max(160)
const visualSchema = z.object({
  version: z.literal(1),
  title: label.optional(),
  summary: z.string().trim().min(1).max(1600).optional(),
  metrics: z.array(z.object({
    label,
    value: z.number(),
    format: z.enum(['BRL', 'percent', 'number']),
  })).max(8),
  bars: z.array(z.object({
    label,
    value: z.number().nonnegative(),
    total: z.number().positive(),
  }).refine(bar => bar.value <= bar.total)).max(8).optional(),
  callouts: z.array(z.object({
    type: z.enum(['resumo', 'informacao', 'atencao', 'dica', 'comparacao', 'recomendacao']),
    text: z.string().trim().min(1).max(1600),
  })).max(6).optional(),
}).refine(block => Boolean(block.summary || block.metrics.length || block.bars?.length || block.callouts?.length))

export type VisualBlock = z.infer<typeof visualSchema>

type AssistantPart =
  | { kind: 'markdown'; html: string }
  | { kind: 'visual'; block: VisualBlock }
  | { kind: 'code'; text: string; label: string }
  | { kind: 'pending' }

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

const linkProtocols = new Set(['https:', 'http:', 'mailto:'])
const markdown = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html: ({ text }) => escapeHtml(text),
    image: ({ text }) => escapeHtml(text),
    heading({ depth, tokens }) {
      const level = Math.min(depth + 2, 6)
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>`
    },
    link({ href, title, tokens }) {
      const content = this.parser.parseInline(tokens)
      try {
        const url = new URL(href)
        if (!linkProtocols.has(url.protocol)) return content
        const tooltip = title ? ` title="${escapeHtml(title)}"` : ''
        return `<a href="${escapeHtml(url.href)}"${tooltip} target="_blank" rel="noopener noreferrer">${content}</a>`
      } catch {
        return content
      }
    },
    table(token) {
      const table = Renderer.prototype.table.call(this, token)
      return `<div class="chat-table" role="region" aria-label="Tabela" tabindex="0">${table}</div>`
    },
  },
})

function renderMarkdown(tokens: Token[]): string {
  return DOMPurify.sanitize(markdown.parser(tokens), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
      'blockquote', 'hr', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'start', 'align', 'role', 'aria-label', 'tabindex'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  })
}

function hasClosingFence(raw: string): boolean {
  const opening = raw.match(/^ {0,3}(`{3,}|~{3,})/)?.[1]
  const trimmed = raw.trimEnd()
  const closing = trimmed.slice(trimmed.lastIndexOf('\n') + 1).match(/^ {0,3}(`{3,}|~{3,})$/)?.[1]
  return Boolean(opening && closing && opening[0] === closing[0] && closing.length >= opening.length)
}

function parseVisual(text: string): VisualBlock | undefined {
  try {
    const result = visualSchema.safeParse(JSON.parse(text))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

export function renderAssistantContent(content: string, streaming: boolean): AssistantPart[] {
  const parts: AssistantPart[] = []
  let prose: Token[] = []
  function flushProse() {
    if (!prose.length) return
    const html = renderMarkdown(prose)
    if (html) parts.push({ kind: 'markdown', html })
    prose = []
  }

  for (const token of markdown.lexer(content)) {
    if (token.type !== 'code') {
      prose.push(token)
      continue
    }

    flushProse()
    const code = token as Tokens.Code
    const language = code.lang?.trim().split(/\s+/, 1)[0]
    if (language === 'fimap') {
      const closed = hasClosingFence(code.raw)
      // No streaming, a linha da cerca ainda pode mudar até chegar sua quebra de linha.
      if (streaming && (!closed || !code.raw.endsWith('\n'))) {
        parts.push({ kind: 'pending' })
        continue
      }
      const block = closed ? parseVisual(code.text) : undefined
      if (block) parts.push({ kind: 'visual', block })
      else parts.push({ kind: 'code', text: code.text, label: 'Dados da resposta' })
    } else if (code.text || !streaming) {
      parts.push({ kind: 'code', text: code.text, label: language?.slice(0, 36) || 'Código' })
    }
  }

  flushProse()
  return parts
}
