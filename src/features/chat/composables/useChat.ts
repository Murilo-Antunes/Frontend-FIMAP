import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { useZodForm } from '@/composables/useZodForm'
import { chatMessageSchema } from '../schemas/chat.schemas'
import { chatService } from '../services/chat.service'
import type { Chat, ChatMessage } from '../types/chat.types'

export function useChat() {
  const auth = useAuthStore()
  const chats = ref<Chat[]>([])
  const selectedId = ref<number | null>(null)
  const messages = ref<ChatMessage[]>([])
  const draft = ref('')
  const search = ref('')
  const loading = ref(false)
  const loadingMessages = ref(false)
  const sending = ref(false)
  const historyError = ref('')
  const error = ref('')
  const transcript = ref<HTMLElement | null>(null)
  const cache = new Map<number, ChatMessage[]>()
  const form = useZodForm(chatMessageSchema)
  let session = new AbortController()
  let detail: AbortController | null = null
  let generation = 0
  const selected = computed(() => chats.value.find(chat => chat.id === selectedId.value))
  const filtered = computed(() => chats.value.filter(chat => chat.nome.toLocaleLowerCase('pt-BR')
    .includes(search.value.toLocaleLowerCase('pt-BR'))))
  const describeError = (cause: unknown) => axios.isAxiosError(cause)
    ? toApiError(cause).mensagem
    : cause instanceof Error ? cause.message : toApiError(cause).mensagem

  async function load() {
    if (!auth.isAuthenticated) return
    const current = generation
    loading.value = true
    historyError.value = ''
    try {
      const result = await chatService.list(session.signal)
      if (current === generation) chats.value = result
    } catch (cause) {
      if (current === generation && !session.signal.aborted) historyError.value = describeError(cause)
    } finally {
      if (current === generation) loading.value = false
    }
  }

  function newChat() {
    if (sending.value) return
    detail?.abort()
    selectedId.value = null
    messages.value = []
    draft.value = ''
    error.value = ''
    loadingMessages.value = false
    form.clearErrors()
  }

  async function select(chat: Chat) {
    if (!auth.isAuthenticated || sending.value) return
    detail?.abort()
    const controller = new AbortController()
    detail = controller
    selectedId.value = chat.id
    error.value = ''
    draft.value = ''
    form.clearErrors()
    messages.value = cache.get(chat.id) ?? []
    if (cache.has(chat.id)) { loadingMessages.value = false; return }
    loadingMessages.value = true
    try {
      const result = await chatService.messages(chat.id, controller.signal)
      if (!controller.signal.aborted) {
        messages.value = result
        cache.set(chat.id, result)
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        error.value = axios.isAxiosError(cause) && cause.response?.status === 404
          ? 'O servidor ainda não disponibiliza a leitura das mensagens desta conversa. Inicie uma nova conversa para falar com a IA.'
          : describeError(cause)
      }
    } finally {
      if (!controller.signal.aborted) loadingMessages.value = false
    }
  }

  async function send() {
    if (!auth.isAuthenticated || sending.value || loading.value || loadingMessages.value || historyError.value) return
    // Não envie sem conhecer o histórico de uma conversa existente.
    if (selectedId.value !== null && !cache.has(selectedId.value)) return
    const data = form.validate({ pergunta: draft.value })
    if (!data) return
    const current = generation
    const signal = session.signal
    sending.value = true
    error.value = ''
    try {
      if (selectedId.value === null) {
        const chat = await chatService.create(data.pergunta.slice(0, 45), signal)
        if (current !== generation) return
        chats.value.unshift(chat)
        selectedId.value = chat.id
        cache.set(chat.id, [])
      }
      const id = selectedId.value!
      const previous = [...messages.value]
      messages.value = [...previous, { papel: 0, conteudo: data.pergunta }, { papel: 1, conteudo: '' }]
      draft.value = ''
      let completed = false
      try {
        await chatService.send(id, data.pergunta, event => {
          if (current !== generation) return
          if (event.tipo === 'trecho') {
            const answer = messages.value[messages.value.length - 1]
            if (answer) answer.conteudo += event.conteudo
          }
          if (event.tipo === 'fim') completed = true
        }, signal)
        if (current === generation && completed) cache.set(id, [...messages.value])
      } catch (cause) {
        if (current === generation) {
          // Um trecho recebido não comprova que o backend salvou o par.
          messages.value = previous
          draft.value = data.pergunta
          cache.delete(id)
        }
        throw cause
      }
    } catch (cause) {
      if (current === generation && !signal.aborted) error.value = describeError(cause)
    } finally {
      if (current === generation) sending.value = false
    }
  }

  watch(() => auth.usuario?.id, id => {
    generation++
    session.abort()
    detail?.abort()
    session = new AbortController()
    cache.clear()
    chats.value = []
    selectedId.value = null
    messages.value = []
    draft.value = ''
    search.value = ''
    error.value = ''
    historyError.value = ''
    sending.value = false
    loadingMessages.value = false
    if (id) void load()
  }, { immediate: true })
  watch(() => messages.value.map(message => message.conteudo).join(''), async () => {
    await nextTick()
    transcript.value?.scrollTo({ top: transcript.value.scrollHeight, behavior: 'smooth' })
  })
  onScopeDispose(() => { session.abort(); detail?.abort() })

  const canSend = computed(() => auth.isAuthenticated && !sending.value && !loading.value && !loadingMessages.value && !historyError.value
    && (selectedId.value === null || cache.has(selectedId.value)))
  return { chats, selected, messages, draft, search, loading, loadingMessages, sending, historyError,
    error, transcript, filtered, form, canSend, load, select, newChat, send }
}
