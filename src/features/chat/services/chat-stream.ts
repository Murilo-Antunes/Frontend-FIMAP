import type { ChatEvent } from '../types/chat.types'

/** SSE pode dividir um evento e até um caractere UTF-8 entre blocos. */
export async function readChatStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finished = false
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      buffer = buffer.replace(/\r\n/g, '\n')
      let boundary: number
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        const data = frame.split('\n').filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trimStart()).join('\n')
        if (!data) continue
        const event: ChatEvent = JSON.parse(data)
        if (event.tipo === 'erro') throw new Error(event.mensagem)
        if (event.tipo === 'fim') finished = true
        onEvent(event)
      }
      if (done) break
    }
    if (!finished) throw new Error('A resposta foi interrompida. Consulte o histórico antes de enviar novamente.')
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
