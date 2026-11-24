import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { useZodForm } from '@/composables/useZodForm'
import { chatMessageSchema } from '../schemas/chat.schemas'
import type { FinancialAction } from '../schemas/financial-action.schemas'
import { chatService } from '../services/chat.service'
import type { Chat, ChatMessage } from '../types/chat.types'

export const CHAT_LIMIT = 20
export const CHAT_NAME_LIMIT = 45

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
  const confirmingFinancialAction = ref<string | null>(null)
  const financialActionError = ref<{ id: string; message: string } | null>(null)
  const managing = ref(false)
  const managementError = ref('')
  const historyError = ref('')
  const error = ref('')
  const transcript = ref<HTMLElement | null>(null)
  const cache = new Map<number, ChatMessage[]>()
  const form = useZodForm(chatMessageSchema)
  let session = new AbortController()
  let detail: AbortController | null = null
  let generation = 0
  const selected = computed(() => chats.value.find(chat => chat.id === selectedId.value))
  const atLimit = computed(() => chats.value.length >= CHAT_LIMIT)
  const filtered = computed(() => chats.value.filter(chat => chat.nome.toLocaleLowerCase('pt-BR')
    .includes(search.value.toLocaleLowerCase('pt-BR'))))
  const describeError = (cause: unknown) => axios.isAxiosError(cause)
    ? toApiError(cause).mensagem
    : cause instanceof Error ? cause.message : toApiError(cause).mensagem

  async function load() {
    if (!auth.isAuthenticated || loading.value || managing.value) return
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
    if (sending.value || confirmingFinancialAction.value) return
    detail?.abort()
    selectedId.value = null
    messages.value = []
    draft.value = ''
    error.value = ''
    financialActionError.value = null
    loadingMessages.value = false
    form.clearErrors()
  }

  async function manageChat(chat: Chat, name: string | null): Promise<boolean> {
    if (!auth.isAuthenticated || sending.value || confirmingFinancialAction.value || loading.value || managing.value) return false
    const current = generation
    const signal = session.signal
    managing.value = true
    managementError.value = ''
    try {
      if (name === null) await chatService.remove(chat.id, signal)
      else await chatService.rename(chat.id, name, signal)
      if (current !== generation || signal.aborted) return false

      if (name === null) {
        chats.value = chats.value.filter(item => item.id !== chat.id)
        cache.delete(chat.id)
        if (selectedId.value === chat.id) newChat()
      } else {
        chats.value = chats.value.map(item => item.id === chat.id ? { ...item, nome: name } : item)
      }
      return true
    } catch (cause) {
      if (current === generation && !signal.aborted) managementError.value = describeError(cause)
      return false
    } finally {
      if (current === generation) managing.value = false
    }
  }

  async function select(chat: Chat) {
    if (!auth.isAuthenticated || sending.value || confirmingFinancialAction.value) return
    detail?.abort()
    const controller = new AbortController()
    detail = controller
    selectedId.value = chat.id
    error.value = ''
    financialActionError.value = null
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

  async function confirmFinancialAction(action: FinancialAction) {
    const id = selectedId.value
    if (id === null || !canSend.value || action.status !== 'pronta') return
    const current = generation
    const signal = session.signal
    const isCurrent = () => current === generation && !signal.aborted && selectedId.value === id
    confirmingFinancialAction.value = action.id
    financialActionError.value = null

    try {
      const saved = await chatService.confirmFinancialAction(id, action, signal)
      if (!isCurrent()) return
      const updateAction = (message: ChatMessage) => message.acoes_financeiras ? {
        ...message,
        acoes_financeiras: message.acoes_financeiras.map(item => item.id === saved.id && item.versao === saved.versao ? saved : item),
      } : message
      messages.value = messages.value.map(updateAction)
      cache.set(id, (cache.get(id) ?? []).map(updateAction))
    } catch (cause) {
      if (!isCurrent()) return
      if (axios.isAxiosError(cause) && cause.response?.status === 409) {
        try {
          const result = await chatService.messages(id, signal)
          if (!isCurrent()) return
          messages.value = result
          cache.set(id, result)
          financialActionError.value = { id: action.id, message: 'A proposta mudou. Revise os dados atualizados antes de salvar.' }
        } catch (refreshError) {
          if (isCurrent()) financialActionError.value = { id: action.id, message: describeError(refreshError) }
        }
      } else {
        financialActionError.value = { id: action.id, message: describeError(cause) }
      }
    } finally {
      if (isCurrent()) confirmingFinancialAction.value = null
    }
  }

  async function send() {
    if (!canSend.value) return
    const data = form.validate({ pergunta: draft.value })
    if (!data) return
    const current = generation
    const signal = session.signal
    sending.value = true
    error.value = ''
    financialActionError.value = null
    try {
      if (selectedId.value === null) {
        const chat = await chatService.create(data.pergunta.slice(0, CHAT_NAME_LIMIT), signal)
        if (current !== generation) return
        chats.value.unshift(chat)
        selectedId.value = chat.id
        cache.set(chat.id, [])
      }
      const id = selectedId.value!
      const previous = [...messages.value]
      const savedMessages = cache.get(id) ?? []
      messages.value = [...previous, { papel: 0, conteudo: data.pergunta }, { papel: 1, conteudo: '' }]
      draft.value = ''
      let completed = false
      let financialActions: FinancialAction[] | undefined
      try {
        await chatService.send(id, data.pergunta, event => {
          if (current !== generation) return
          if (event.tipo === 'trecho') {
            const answer = messages.value[messages.value.length - 1]
            if (answer) answer.conteudo += event.conteudo
          }
          if (event.tipo === 'fim') {
            if (event.id_chat !== id) throw new Error('O servidor retornou uma resposta de outra conversa.')
            completed = true
            financialActions = event.acoes_financeiras
          }
        }, signal)
        if (current === generation && completed) {
          const answer = messages.value.at(-1)
          if (answer && financialActions) answer.acoes_financeiras = financialActions
          cache.set(id, [...savedMessages, ...messages.value.slice(previous.length)])
        }
      } catch (cause) {
        if (current === generation) {
          // Uma resposta parcial fica visível nesta sessão sem entrar no histórico salvo.
          if (messages.value.at(-1)?.conteudo && !signal.aborted) return
          messages.value = previous
          draft.value = data.pergunta
          cache.delete(id)
        }
        throw cause
      }
    } catch (cause) {
      if (current === generation && !signal.aborted) {
        error.value = describeError(cause)
        if (selectedId.value === null && axios.isAxiosError(cause)
          && cause.response?.status === 409 && cause.response.data?.codigo === 'CHAT_LIMITE_USUARIO') {
          await load()
        }
      }
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
    confirmingFinancialAction.value = null
    financialActionError.value = null
    managing.value = false
    managementError.value = ''
    loading.value = false
    loadingMessages.value = false
    if (id) void load()
  }, { immediate: true })
  const lastAction = computed(() => {
    const action = messages.value.at(-1)?.acoes_financeiras?.[0]
    return action ? `${action.id}-${action.versao}` : undefined
  })
  watch([() => messages.value.map(message => message.conteudo).join(''), lastAction], async ([, action], [, previousAction]) => {
    await nextTick()
    const element = transcript.value
    if (!element) return
    const card = action && action !== previousAction ? element.querySelector(`[data-financial-action="${action}"]`) : null
    const message = card?.closest('[data-chat-message]')
    const top = message
      ? element.scrollTop + message.getBoundingClientRect().top - element.getBoundingClientRect().top - 16
      : element.scrollHeight
    element.scrollTo({ top, behavior: 'smooth' })
  })
  onScopeDispose(() => { session.abort(); detail?.abort() })

  const canSend = computed(() => auth.isAuthenticated && !sending.value && !managing.value && !confirmingFinancialAction.value
    && !loading.value && !loadingMessages.value && !historyError.value
    && (selectedId.value === null ? !atLimit.value : cache.has(selectedId.value)))
  return { chats, selected, messages, draft, search, loading, loadingMessages, sending, historyError,
    error, transcript, filtered, form, canSend, atLimit, managing, managementError,
    confirmingFinancialAction, financialActionError, confirmFinancialAction, load, select, newChat, send, manageChat }
}
