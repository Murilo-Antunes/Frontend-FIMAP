<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUp, Bot, MessageSquare, PanelLeftOpen, Pencil, Plus, Search, Trash2, X } from 'lucide-vue-next'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import ChatAssistantMessage from '../components/ChatAssistantMessage.vue'
import ChatFinancialActionCard from '../components/ChatFinancialActionCard.vue'
import { CHAT_LIMIT, CHAT_NAME_LIMIT, useChat } from '../composables/useChat'
import type { FinancialAction } from '../schemas/financial-action.schemas'
import type { Chat } from '../types/chat.types'

const { chats, selected, messages, draft, search, loading, loadingMessages, sending, historyError,
  error, transcript, filtered, form, canSend, atLimit, managing, managementError,
  confirmingFinancialAction, financialActionError, confirmFinancialAction, load, select, newChat, send, manageChat } = useChat()
const historyOpen = ref(true)
const auth = useAuthStore()
const dialog = ref<HTMLDialogElement | null>(null)
const action = ref<{ chat: Chat; kind: 'rename' | 'delete' } | null>(null)
const chatName = ref('')
const question = ref<HTMLTextAreaElement | null>(null)
const busy = computed(() => sending.value || managing.value || confirmingFinancialAction.value !== null)
const cannotCreate = computed(() => !auth.isAuthenticated || loading.value || !!historyError.value
  || busy.value || atLimit.value)
const limitMessage = 'Você atingiu o limite de conversas. Exclua uma para criar outra.'

const financialActionsByMessage = computed(() => {
  const latest = new Map<string, { index: number; action: FinancialAction }>()
  messages.value.forEach((message, index) => {
    for (const action of message.acoes_financeiras ?? []) {
      const previous = latest.get(action.id)
      if (!previous || action.versao >= previous.action.versao) latest.set(action.id, { index, action })
    }
  })
  const byMessage = new Map<number, FinancialAction[]>()
  for (const { index, action } of latest.values()) {
    const group = byMessage.get(index) ?? []
    group.push(action)
    byMessage.set(index, group)
  }
  return byMessage
})

watch(action, (value) => {
  if (value) dialog.value?.showModal()
  else dialog.value?.close()
}, { flush: 'post' })
watch(() => auth.usuario?.id, () => { action.value = null })

function openAction(chat: Chat, kind: 'rename' | 'delete') {
  managementError.value = ''
  chatName.value = chat.nome
  action.value = { chat, kind }
}

function closeAction() {
  if (!managing.value) action.value = null
}

async function confirmAction() {
  const pending = action.value
  if (!pending) return
  const name = chatName.value.trim()
  if (pending.kind === 'rename' && (!name || name.length > CHAT_NAME_LIMIT)) return
  if (await manageChat(pending.chat, pending.kind === 'rename' ? name : null)) {
    if (action.value === pending) action.value = null
  }
}

const initials = computed(() => (auth.usuario?.nome ?? '').split(' ').filter(Boolean).slice(0, 2)
  .map(part => part[0]).join('').toUpperCase())
function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date)
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send()
  }
}

function adjustFinancialAction(proposal: FinancialAction) {
  if (!draft.value.trim()) {
    const context = {
      meta: 'Na meta',
      investimento: 'Na simulação de investimento',
      amortizacao: 'Na simulação de amortização',
    }[proposal.tipo]
    draft.value = proposal.nome ? `${context} “${proposal.nome}”, ` : `${context} em preparação, `
  }
  question.value?.focus()
}
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-[60px] lg:py-10">
    <section class="chat-shell overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm" aria-label="Chat com a IA Fimap">
      <aside v-if="historyOpen" class="flex min-h-0 flex-col border-b border-neutral-200 md:border-r md:border-b-0" aria-label="Histórico de chats">
        <div class="border-b border-neutral-200 p-5">
          <div class="flex items-center justify-between gap-3">
            <h1 class="text-lg font-semibold">Histórico de Chats</h1>
            <button class="icon-button" aria-label="Recolher histórico" @click="historyOpen = false"><X :size="18" /></button>
          </div>
          <p class="mt-1 text-xs text-neutral-500">Reveja suas últimas conversas com a IA</p>
          <label class="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-400">
            <Search :size="16" aria-hidden="true" />
            <input v-model="search" type="search" aria-label="Buscar conversas" placeholder="Buscar conversas recentes..." class="min-w-0 flex-1 bg-transparent text-xs text-neutral-800 outline-none" />
          </label>
          <button class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40" :disabled="cannotCreate" @click="newChat"><Plus :size="16" /> Nova conversa</button>
          <div v-if="auth.isAuthenticated && !loading && !historyError" class="mt-2 text-xs text-neutral-500">
            <p>{{ chats.length }} de {{ CHAT_LIMIT }} conversas</p>
            <p v-if="atLimit" class="mt-1">{{ limitMessage }}</p>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <p class="px-2 py-2 text-[11px] font-semibold tracking-wider text-neutral-400">RECENTES</p>
          <p v-if="loading" role="status" class="p-3 text-sm text-neutral-500">Carregando conversas...</p>
          <div v-else-if="historyError" class="p-2">
            <FormAlert>{{ historyError }}</FormAlert>
            <button class="mt-3 text-sm underline" @click="load">Tentar novamente</button>
          </div>
          <div v-else-if="!chats.length" class="px-4 py-10 text-center text-neutral-500">
            <MessageSquare :size="24" class="mx-auto mb-3 text-neutral-300" />
            <p class="text-sm font-medium">Nenhuma conversa ainda</p>
            <p class="mt-2 text-xs leading-5">Sua primeira conversa aparecerá aqui quando você enviar uma pergunta.</p>
          </div>
          <p v-else-if="!filtered.length" class="p-3 text-sm text-neutral-500">Nenhuma conversa encontrada.</p>
          <div v-for="chat in filtered" :key="chat.id" class="mb-1 flex items-center gap-1 rounded-xl border pr-2 transition hover:bg-neutral-50"
            :class="selected?.id === chat.id ? 'border-neutral-200 bg-neutral-100' : 'border-transparent'">
            <button type="button" class="min-w-0 flex-1 rounded-xl p-3 text-left disabled:opacity-50"
              :disabled="busy" :aria-current="selected?.id === chat.id ? 'true' : undefined" @click="select(chat)">
              <span class="block truncate text-sm" :class="{ 'font-semibold': selected?.id === chat.id }">{{ chat.nome }}</span>
              <span class="mt-1 block text-[11px] text-neutral-500">{{ dateLabel(chat.data_criacao) }}</span>
            </button>
            <button type="button" class="icon-button" :disabled="busy || loading" :aria-label="`Renomear ${chat.nome}`" title="Renomear conversa" @click="openAction(chat, 'rename')"><Pencil :size="16" /></button>
            <button type="button" class="icon-button hover:text-red-700" :disabled="busy || loading" :aria-label="`Excluir ${chat.nome}`" title="Excluir conversa" @click="openAction(chat, 'delete')"><Trash2 :size="16" /></button>
          </div>
        </div>
      </aside>
      <div class="flex min-h-0 min-w-0 flex-col" :class="{ 'md:col-span-2': !historyOpen }">
        <header class="mx-4 flex min-h-20 items-center gap-3 border-b border-neutral-200 py-4 sm:mx-8">
          <button v-if="!historyOpen" class="icon-button" aria-label="Abrir histórico" @click="historyOpen = true"><PanelLeftOpen :size="20" /></button>
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">AI</span>
          <div class="min-w-0 flex-1"><h2 class="truncate text-sm font-semibold">{{ selected?.nome ?? 'Fimap Copilot' }}</h2><p class="mt-1 text-xs text-neutral-500">{{ selected ? `Iniciada em ${dateLabel(selected.data_criacao)}` : 'Seu assistente financeiro' }}</p></div>
          <button v-if="!historyOpen" class="icon-button" :disabled="cannotCreate" aria-label="Nova conversa" :title="atLimit ? limitMessage : 'Nova conversa'" @click="newChat"><Plus :size="20" /></button>
        </header>
        <div :ref="element => { transcript = element as HTMLElement | null }" class="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8" role="log" aria-label="Mensagens da conversa" :aria-busy="sending || loadingMessages">
          <p v-if="loadingMessages" role="status" class="text-center text-sm text-neutral-500">Carregando mensagens...</p>
          <div v-else-if="!messages.length && !error" class="flex h-full flex-col items-center justify-center px-4 text-center">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100"><Bot :size="28" /></div>
            <h2 class="text-xl font-semibold">Como posso ajudar com suas finanças?</h2>
            <p class="mt-3 max-w-sm text-sm leading-6 text-neutral-500">Comece uma conversa sobre seus gastos, planejamento ou objetivos financeiros.</p>
          </div>
          <div v-for="(message, index) in messages" :key="message.id === undefined ? `local-${index}` : `message-${message.id}`" class="mb-6" data-chat-message>
            <div v-if="message.papel === 0 || message.conteudo || (sending && index === messages.length - 1)"
              class="flex items-start gap-3" :class="{ 'flex-row-reverse': message.papel === 0 }">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[10px] text-white">{{ message.papel === 0 ? initials : 'AI' }}</span>
              <div v-if="message.papel === 0" class="min-w-0 max-w-[88%] rounded-2xl bg-black px-4 py-3 text-sm leading-6 wrap-anywhere whitespace-pre-wrap text-white">{{ message.conteudo }}</div>
              <ChatAssistantMessage v-else class="max-w-3xl flex-1 pt-0.5" :content="message.conteudo" :streaming="sending && index === messages.length - 1" />
            </div>
            <div v-if="financialActionsByMessage.has(index)" class="mt-4 min-w-0 max-w-3xl space-y-4 sm:ml-10">
              <ChatFinancialActionCard v-for="proposal in financialActionsByMessage.get(index)" :key="proposal.id"
                :action="proposal" :data-financial-action="`${proposal.id}-${proposal.versao}`"
                :busy="confirmingFinancialAction === proposal.id" :disabled="!canSend"
                :error="financialActionError?.id === proposal.id && proposal.status !== 'salva' ? financialActionError.message : undefined"
                @confirm="confirmFinancialAction" @adjust="adjustFinancialAction(proposal)" />
            </div>
          </div>
        </div>
        <div class="px-4 pb-4 sm:px-8 sm:pb-5">
          <p v-if="!auth.isAuthenticated" class="mb-3 text-center text-xs text-neutral-500">Prévia da tela. Entre na sua conta para enviar mensagens e acessar suas conversas.</p>
          <FormAlert v-if="error" class="mb-3">{{ error }}</FormAlert>
          <p v-if="!historyOpen && atLimit && !selected" class="mb-3 text-center text-xs text-neutral-500">{{ limitMessage }}</p>
          <form class="flex items-end gap-3 rounded-2xl bg-neutral-100 p-3 shadow-sm" @submit.prevent="send">
            <label for="chat-question" class="sr-only">Pergunte algo sobre suas finanças</label>
            <textarea id="chat-question" ref="question" v-model="draft" rows="2" maxlength="2000" placeholder="Pergunte algo sobre suas finanças..." class="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-neutral-400 disabled:opacity-50" :disabled="!canSend" :aria-invalid="!!form.errors.pergunta" :aria-describedby="form.errors.pergunta ? 'chat-question-error' : undefined" @input="form.clearError('pergunta')" @keydown="onKeydown" />
            <button type="submit" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-neutral-700 disabled:opacity-30" :disabled="!canSend || !draft.trim()" :aria-label="sending ? 'Aguardando resposta' : 'Enviar mensagem'"><ArrowUp :size="21" /></button>
          </form>
          <p v-if="form.errors.pergunta" id="chat-question-error" role="alert" class="mt-2 text-xs text-red-600">{{ form.errors.pergunta }}</p>
          <p class="mt-2 text-center text-[10px] text-neutral-400">{{ sending ? 'A IA está respondendo...' : 'Enter para enviar · Shift + Enter para uma nova linha' }}</p>
        </div>
      </div>
    </section>
    <dialog ref="dialog" class="m-auto w-[min(92vw,26rem)] rounded-2xl bg-white p-6 text-neutral-950 shadow-2xl backdrop:bg-neutral-950/40"
      aria-labelledby="chat-action-title" @cancel.prevent="closeAction">
      <form v-if="action" @submit.prevent="confirmAction">
        <h2 id="chat-action-title" class="text-lg font-semibold">{{ action.kind === 'rename' ? 'Renomear conversa' : 'Excluir conversa?' }}</h2>
        <div v-if="action.kind === 'rename'" class="mt-4">
          <label for="chat-name" class="block text-sm font-medium">Nome da conversa</label>
          <input id="chat-name" v-model="chatName" class="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            :maxlength="CHAT_NAME_LIMIT" :disabled="managing" required autofocus />
        </div>
        <p v-else class="mt-2 text-sm text-neutral-600">A conversa “{{ action.chat.nome }}” e suas mensagens serão excluídas permanentemente.</p>
        <FormAlert v-if="managementError" class="mt-3">{{ managementError }}</FormAlert>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-xl border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
            :disabled="managing" @click="closeAction">Cancelar</button>
          <button type="submit" class="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            :class="action.kind === 'rename' ? 'bg-black hover:bg-neutral-700' : 'bg-red-700 hover:bg-red-800'"
            :disabled="managing || (action.kind === 'rename' && !chatName.trim())">
            {{ action.kind === 'rename' ? (managing ? 'Salvando…' : 'Salvar') : (managing ? 'Excluindo…' : 'Excluir') }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.chat-shell { display: grid; grid-template-columns: minmax(250px, 36%) minmax(0, 1fr); height: max(600px, calc(100dvh - 205px)); }
.icon-button { padding: 6px; border-radius: 8px; color: #737373; }
.icon-button:not(:disabled):hover { background: #f5f5f5; }
.icon-button:disabled { opacity: 0.4; }
button:focus-visible, textarea:focus-visible, input:focus-visible { outline: 2px solid #737373; outline-offset: 3px; }
@media (max-width: 767px) {
  .chat-shell { grid-template-columns: minmax(0, 1fr); height: auto; min-height: calc(100dvh - 150px); }
  .chat-shell > aside { max-height: 320px; }
  .chat-shell > div { height: max(540px, calc(100dvh - 170px)); }
}
</style>
