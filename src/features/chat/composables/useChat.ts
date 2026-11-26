import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { useZodForm } from '@/composables/useZodForm'
import { chatMessageSchema } from '../schemas/chat.schemas'
import type { FinancialAction } from '../schemas/financial-action.schemas'
import { chatService } from '../services/chat.service'
import type { Chat, ChatMessage } from '../types/chat.types'

type PendingChatRequest = { userId: number; chatId: number; requestId: string; pergunta: string }
const PENDING_KEY = 'fimap.chat.pending.v1'
const LAST_CHAT_KEY = 'fimap.chat.last.v1'
const STATUS_TIMEOUT_MS = 5_000
const STATUS_POLL_INTERVAL_MS = 1_500
const RECOVERY_TIMEOUT_MS = 130_000
const STATUS_FAILURE_LIMIT = 2
function readLastChat(userId: number): number | null {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_CHAT_KEY) ?? '{}') as Record<string, unknown>
    const id = value[String(userId)]
    return Number.isInteger(id) ? id as number : null
  } catch { return null }
}
function saveLastChat(userId: number, chatId: number | null) {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_CHAT_KEY) ?? '{}') as Record<string, unknown>
    if (chatId === null) delete value[String(userId)]
    else value[String(userId)] = chatId
    localStorage.setItem(LAST_CHAT_KEY, JSON.stringify(value))
  } catch { /* storage may be disabled */ }
}
function readPending(): PendingChatRequest[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter(item => item && Number.isInteger(item.userId)
      && Number.isInteger(item.chatId) && typeof item.requestId === 'string' && typeof item.pergunta === 'string') : []
  } catch { return [] }
}
function writePending(items: PendingChatRequest[]) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(items)) } catch { /* storage may be disabled */ }
}
function savePending(item: PendingChatRequest) { writePending([...readPending().filter(existing => existing.requestId !== item.requestId), item]) }
function forgetPending(requestId: string) { writePending(readPending().filter(item => item.requestId !== requestId)) }
function mergeById(current: ChatMessage[], incoming: ChatMessage[]) {
  const result = [...current]
  for (const message of incoming) {
    const index = message.id === undefined ? -1 : result.findIndex(item => item.id === message.id)
    if (index >= 0) result[index] = { ...result[index], ...message }
    else result.push({ ...message })
  }
  return result
}

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
  const pendingRequest = ref<PendingChatRequest | null>(null)
  const checkingStatus = ref(false)
  const confirmingFinancialAction = ref<string | null>(null)
  const financialActionError = ref<{ id: string; message: string } | null>(null)
  const managing = ref(false)
  const managementError = ref('')
  const historyError = ref('')
  const error = ref('')
  const transcript = ref<HTMLElement | null>(null)
  const shouldFollowTranscript = ref(true)
  const cache = new Map<number, ChatMessage[]>()
  const localPending = new Map<number, PendingChatRequest>()
  const retryableRequests = new Map<number, PendingChatRequest>()
  const chatsWithCancelledFirstMessage = new Set<number>()
  const form = useZodForm(chatMessageSchema)
  let session = new AbortController()
  let detail: AbortController | null = null
  let sendController: AbortController | null = null
  let statusController: AbortController | null = null
  let disposed = false
  let generation = 0
  const selected = computed(() => chats.value.find(chat => chat.id === selectedId.value))
  const atLimit = computed(() => chats.value.length >= CHAT_LIMIT)
  const filtered = computed(() => chats.value.filter(chat => chat.nome.toLocaleLowerCase('pt-BR')
    .includes(search.value.toLocaleLowerCase('pt-BR'))))
  const describeError = (cause: unknown) => axios.isAxiosError(cause)
    ? toApiError(cause).mensagem
    : cause instanceof Error ? cause.message : toApiError(cause).mensagem

  function finishRequest(item: PendingChatRequest) {
    forgetPending(item.requestId)
    if (localPending.get(item.chatId)?.requestId === item.requestId) localPending.delete(item.chatId)
    if (pendingRequest.value?.requestId === item.requestId) pendingRequest.value = null
  }

  function restoreQuestion(item: PendingChatRequest, message: string) {
    messages.value = [...(cache.get(item.chatId) ?? [])]
    if (!draft.value.trim()) draft.value = item.pergunta
    error.value = message
  }

  function cancelStatusCheck() {
    statusController?.abort()
    statusController = null
    checkingStatus.value = false
  }

  async function reconcileRequest(item: PendingChatRequest) {
    if (disposed || statusController || pendingRequest.value?.requestId !== item.requestId) return
    const controller = new AbortController()
    statusController = controller
    checkingStatus.value = true
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(RECOVERY_TIMEOUT_MS)])
    let failures = 0
    try {
      while (!signal.aborted && failures < STATUS_FAILURE_LIMIT) {
        try {
          const querySignal = AbortSignal.any([signal, AbortSignal.timeout(STATUS_TIMEOUT_MS)])
          const response = await chatService.requestStatus(item.requestId, querySignal).catch(cause => {
            if (axios.isAxiosError(cause) && cause.response?.status === 404 &&
              cause.response.data?.codigo === 'CHAT_NAO_ENCONTRADO') return null
            throw cause
          })
          if (controller.signal.aborted) return
          const state = response?.conteudo?.estado ?? response?.estado
          if (!response || state === 'falhou' || state === 'cancelada' || state === 'expirada') {
            if (!response) retryableRequests.set(item.chatId, item)
            const message = state === 'cancelada' ? 'Resposta cancelada. A pergunta voltou ao rascunho.'
              : 'A pergunta não foi concluída. Revise o rascunho e tente novamente.'
            finishRequest(item)
            restoreQuestion(item, message)
            return
          }
          if (state === 'concluida') {
            const result = response.conteudo?.resultado ?? response.resultado
            const saved = [result?.mensagem_usuario, result?.mensagem_assistente]
              .filter((message): message is ChatMessage => message?.id !== undefined)
            const latest = saved.length === 2 ? mergeById(cache.get(item.chatId) ?? [], saved)
              : await chatService.messages(item.chatId, querySignal)
            if (controller.signal.aborted) return
            cache.set(item.chatId, latest)
            messages.value = latest
            if (draft.value === item.pergunta) draft.value = ''
            error.value = ''
            finishRequest(item)
            return
          }
          failures = state === 'gerando' ? 0 : failures + 1
        } catch {
          failures++
        }
        if (!signal.aborted && failures < STATUS_FAILURE_LIMIT) {
          await new Promise<void>(resolve => setTimeout(resolve, STATUS_POLL_INTERVAL_MS))
        }
      }
      if (!controller.signal.aborted) {
        restoreQuestion(item, 'Não foi possível confirmar o envio. Verifique o status para continuar.')
      }
    } finally {
      if (statusController === controller) cancelStatusCheck()
    }
  }

  function retryStatus() {
    if (!pendingRequest.value || statusController) return
    error.value = ''
    void reconcileRequest(pendingRequest.value)
  }

  function updateTranscriptFollow() {
    const element = transcript.value
    if (!element) return
    shouldFollowTranscript.value = element.scrollHeight - element.scrollTop - element.clientHeight < 48
  }

  async function load() {
    if (!auth.isAuthenticated || loading.value || managing.value) return
    const current = generation
    loading.value = true
    historyError.value = ''
    try {
      const result = await chatService.list(session.signal)
      if (current === generation) {
        chats.value = result
        const lastId = auth.usuario?.id ? readLastChat(auth.usuario.id) : null
        const lastChat = result.find(chat => chat.id === lastId) ?? result[0]
        if (lastChat && selectedId.value === null) void select(lastChat)
      }
    } catch (cause) {
      if (current === generation && !session.signal.aborted) historyError.value = describeError(cause)
    } finally {
      if (current === generation) loading.value = false
    }
  }

  function newChat() {
    if (sending.value || confirmingFinancialAction.value) return
    detail?.abort()
    cancelStatusCheck()
    pendingRequest.value = null
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
        retryableRequests.delete(chat.id)
        chatsWithCancelledFirstMessage.delete(chat.id)
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
    cancelStatusCheck()
    const controller = new AbortController()
    detail = controller
    selectedId.value = chat.id
    pendingRequest.value = readPending().find(item => item.userId === auth.usuario?.id && item.chatId === chat.id)
      ?? localPending.get(chat.id) ?? null
    if (auth.usuario?.id) saveLastChat(auth.usuario.id, chat.id)
    error.value = ''
    financialActionError.value = null
    draft.value = ''
    form.clearErrors()
    messages.value = cache.get(chat.id) ?? []
    if (cache.has(chat.id)) {
      loadingMessages.value = false
      retryStatus()
      return
    }
    loadingMessages.value = true
    try {
      const result = await chatService.messages(chat.id, controller.signal)
      if (!controller.signal.aborted) {
        messages.value = result
        cache.set(chat.id, result)
        retryStatus()
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
    const requestController = new AbortController()
    sendController = requestController
    const abortRequest = () => requestController.abort()
    signal.addEventListener('abort', abortRequest, { once: true })
    sending.value = true
    error.value = ''
    financialActionError.value = null
    try {
      if (selectedId.value === null) {
        const chat = await chatService.create(data.pergunta.slice(0, CHAT_NAME_LIMIT), requestController.signal)
        if (current !== generation) return
        chats.value.unshift(chat)
        selectedId.value = chat.id
        saveLastChat(auth.usuario!.id, chat.id)
        cache.set(chat.id, [])
      }
      const id = selectedId.value!
      if (chatsWithCancelledFirstMessage.has(id)) {
        const title = data.pergunta.slice(0, CHAT_NAME_LIMIT)
        await chatService.rename(id, title, requestController.signal)
        if (current !== generation) return
        chats.value = chats.value.map(chat => chat.id === id ? { ...chat, nome: title } : chat)
      }
      const retryable = retryableRequests.get(id)
      const requestId = retryable?.pergunta === data.pergunta ? retryable.requestId : crypto.randomUUID()
      retryableRequests.delete(id)
      const pending: PendingChatRequest = { userId: auth.usuario!.id, chatId: id, requestId, pergunta: data.pergunta }
      savePending(pending)
      localPending.set(id, pending)
      pendingRequest.value = pending
      const previous = [...messages.value]
      const savedMessages = cache.get(id) ?? []
      messages.value = [...previous, { papel: 0, conteudo: data.pergunta }, { papel: 1, conteudo: '' }]
      draft.value = ''
      let completed = false
      let financialActions: FinancialAction[] | undefined
      try {
        await chatService.send(id, data.pergunta, requestId, event => {
          if (current !== generation || requestController.signal.aborted) return
          if (event.tipo === 'trecho') {
            const answer = messages.value[messages.value.length - 1]
            if (answer) answer.conteudo += event.conteudo
          }
          if (event.tipo === 'fim') {
            if (event.id_chat !== id) throw new Error('O servidor retornou uma resposta de outra conversa.')
            completed = true
            financialActions = event.acoes_financeiras
            const saved = [event.mensagem_usuario, event.mensagem_assistente].filter((message): message is ChatMessage => !!message)
            if (saved.length) messages.value = mergeById(messages.value.slice(0, -2), saved)
          }
        }, requestController.signal)
        if (current === generation && completed && !requestController.signal.aborted) {
          const answer = messages.value.at(-1)
          if (answer && financialActions) answer.acoes_financeiras = financialActions
          cache.set(id, mergeById(savedMessages, messages.value.slice(previous.length)))
          chatsWithCancelledFirstMessage.delete(id)
          finishRequest(pending)
        }
      } catch (cause) {
        if (current === generation) {
          // Falha/EOF é ambígua: preserve a solicitação para consulta pelo mesmo UUID.
          void reconcileRequest(pending)
        }
        throw cause
      }
    } catch (cause) {
      if (current === generation && !signal.aborted && !requestController.signal.aborted) {
        error.value = describeError(cause)
        if (selectedId.value === null && axios.isAxiosError(cause)
          && cause.response?.status === 409 && cause.response.data?.codigo === 'CHAT_LIMITE_USUARIO') {
          await load()
        }
      }
    } finally {
      signal.removeEventListener('abort', abortRequest)
      if (sendController === requestController) sendController = null
      if (current === generation) sending.value = false
    }
  }

  function stop() {
    const pending = pendingRequest.value
    if (!pending) {
      sendController?.abort()
      return
    }
    const sendingRequest = sendController
    void chatService.cancel(pending.requestId, session.signal).then(() => {
      if (pendingRequest.value?.requestId !== pending.requestId) return
      sendingRequest?.abort()
      void reconcileRequest(pending)
    }).catch(cause => {
      if (pendingRequest.value?.requestId === pending.requestId) error.value = describeError(cause)
    })
  }

  watch(() => auth.usuario?.id, id => {
    generation++
    session.abort()
    sendController?.abort()
    detail?.abort()
    cancelStatusCheck()
    pendingRequest.value = null
    session = new AbortController()
    cache.clear()
    localPending.clear()
    retryableRequests.clear()
    chatsWithCancelledFirstMessage.clear()
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
    if (!element || !shouldFollowTranscript.value) return
    const card = action && action !== previousAction ? element.querySelector(`[data-financial-action="${action}"]`) : null
    const message = card?.closest('[data-chat-message]')
    const top = message
      ? element.scrollTop + message.getBoundingClientRect().top - element.getBoundingClientRect().top - 16
      : element.scrollHeight
    element.scrollTo({ top, behavior: 'auto' })
  })
  // Navegar desmonta a tela, mas não encerra o POST: o backend continua a solicitação.
  onScopeDispose(() => {
    disposed = true
    detail?.abort()
    cancelStatusCheck()
  })

  const canSend = computed(() => auth.isAuthenticated && !sending.value
    && !pendingRequest.value
    && !managing.value && !confirmingFinancialAction.value
    && !loading.value && !loadingMessages.value && !historyError.value
    && (selectedId.value === null ? !atLimit.value : cache.has(selectedId.value)))
  const responding = computed(() => sending.value || checkingStatus.value)
  const canRetryStatus = computed(() => pendingRequest.value !== null && !responding.value && !loadingMessages.value)
  return { chats, selected, messages, draft, search, loading, loadingMessages, sending, historyError,
    error, transcript, updateTranscriptFollow, filtered, form, canSend, atLimit, managing, managementError,
    confirmingFinancialAction, financialActionError, confirmFinancialAction, load, select, newChat, send, stop, manageChat,
    responding, canRetryStatus, retryStatus }
}
