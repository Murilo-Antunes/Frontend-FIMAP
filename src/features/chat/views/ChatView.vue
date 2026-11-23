<script setup lang="ts">
import { computed, ref } from 'vue'
import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import { ArrowUp, Bot, ChevronRight, MessageSquare, PanelLeftOpen, Plus, Search, X } from 'lucide-vue-next'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useChat } from '../composables/useChat'

const { chats, selected, messages, draft, search, loading, loadingMessages, sending, historyError,
  error, transcript, filtered, form, canSend, load, select, newChat, send } = useChat()
const historyOpen = ref(true)
const auth = useAuthStore()
const markdown = new Marked({ gfm: true, breaks: true })
const initials = computed(() => (auth.usuario?.nome ?? '').split(' ').filter(Boolean).slice(0, 2)
  .map(part => part[0]).join('').toUpperCase())
function renderMarkdown(content: string): string {
  const html = markdown.parse(content, { async: false })
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
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
          <button class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-40" :disabled="sending" @click="newChat"><Plus :size="16" /> Nova conversa</button>
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
          <button v-for="chat in filtered" :key="chat.id" class="mb-1 flex w-full items-center gap-2 rounded-xl border p-3 text-left transition hover:bg-neutral-50 disabled:opacity-50"
            :class="selected?.id === chat.id ? 'border-neutral-200 bg-neutral-100' : 'border-transparent'"
            :disabled="sending" :aria-current="selected?.id === chat.id ? 'true' : undefined" @click="select(chat)">
            <span class="min-w-0 flex-1"><span class="block truncate text-sm" :class="{ 'font-semibold': selected?.id === chat.id }">{{ chat.nome }}</span><span class="mt-1 block text-[11px] text-neutral-400">{{ dateLabel(chat.data_criacao) }}</span></span>
            <template v-if="selected?.id === chat.id"><span class="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">Ativo</span><ChevronRight :size="16" /></template>
          </button>
        </div>
      </aside>
      <div class="flex min-h-0 min-w-0 flex-col" :class="{ 'md:col-span-2': !historyOpen }">
        <header class="mx-4 flex min-h-20 items-center gap-3 border-b border-neutral-200 py-4 sm:mx-8">
          <button v-if="!historyOpen" class="icon-button" aria-label="Abrir histórico" @click="historyOpen = true"><PanelLeftOpen :size="20" /></button>
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">AI</span>
          <div class="min-w-0 flex-1"><h2 class="truncate text-sm font-semibold">{{ selected?.nome ?? 'Fimap Copilot' }}</h2><p class="mt-1 text-xs text-neutral-500">{{ selected ? `Iniciada em ${dateLabel(selected.data_criacao)}` : 'Seu assistente financeiro' }}</p></div>
          <button v-if="!historyOpen" class="icon-button" :disabled="sending" aria-label="Nova conversa" @click="newChat"><Plus :size="20" /></button>
        </header>
        <div :ref="element => { transcript = element as HTMLElement | null }" class="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8" role="log" aria-label="Mensagens da conversa" :aria-busy="sending || loadingMessages">
          <p v-if="loadingMessages" role="status" class="text-center text-sm text-neutral-500">Carregando mensagens...</p>
          <div v-else-if="!messages.length && !error" class="flex h-full flex-col items-center justify-center px-4 text-center">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100"><Bot :size="28" /></div>
            <h2 class="text-xl font-semibold">Como posso ajudar com suas finanças?</h2>
            <p class="mt-3 max-w-sm text-sm leading-6 text-neutral-500">Comece uma conversa sobre seus gastos, planejamento ou objetivos financeiros.</p>
          </div>
          <div v-for="(message, index) in messages" :key="message.id ?? index" class="mb-6 flex items-start gap-3" :class="message.papel === 0 ? 'flex-row-reverse' : ''">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-[10px] text-white">{{ message.papel === 0 ? initials : 'AI' }}</span>
            <div v-if="message.papel === 0" class="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl bg-black px-4 py-3 text-sm leading-6 text-white">{{ message.conteudo }}</div>
            <div v-else class="markdown-content max-w-[88%] break-words rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 shadow-sm" v-html="message.conteudo ? renderMarkdown(message.conteudo) : 'Preparando resposta...'" />
          </div>
        </div>
        <div class="px-4 pb-4 sm:px-8 sm:pb-5">
          <p v-if="!auth.isAuthenticated" class="mb-3 text-center text-xs text-neutral-500">Prévia da tela. Entre na sua conta para enviar mensagens e acessar suas conversas.</p>
          <FormAlert v-if="error" class="mb-3">{{ error }}</FormAlert>
          <form class="flex items-end gap-3 rounded-2xl bg-neutral-100 p-3 shadow-sm" @submit.prevent="send">
            <label for="chat-question" class="sr-only">Pergunte algo sobre suas finanças</label>
            <textarea id="chat-question" v-model="draft" rows="2" maxlength="2000" placeholder="Pergunte algo sobre suas finanças..." class="min-w-0 flex-1 resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-neutral-400 disabled:opacity-50" :disabled="!canSend" :aria-invalid="!!form.errors.pergunta" :aria-describedby="form.errors.pergunta ? 'chat-question-error' : undefined" @input="form.clearError('pergunta')" @keydown="onKeydown" />
            <button type="submit" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-neutral-700 disabled:opacity-30" :disabled="!canSend || !draft.trim()" :aria-label="sending ? 'Aguardando resposta' : 'Enviar mensagem'"><ArrowUp :size="21" /></button>
          </form>
          <p v-if="form.errors.pergunta" id="chat-question-error" role="alert" class="mt-2 text-xs text-red-600">{{ form.errors.pergunta }}</p>
          <p class="mt-2 text-center text-[10px] text-neutral-400">{{ sending ? 'A IA está respondendo...' : 'Enter para enviar · Shift + Enter para uma nova linha' }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.chat-shell { display: grid; grid-template-columns: minmax(250px, 36%) minmax(0, 1fr); height: max(600px, calc(100dvh - 205px)); }
.icon-button { padding: 6px; border-radius: 8px; color: #737373; }
.icon-button:hover { background: #f5f5f5; }
button:focus-visible, textarea:focus-visible, input:focus-visible { outline: 2px solid #737373; outline-offset: 3px; }
.markdown-content :deep(p) { margin: 0.5rem 0; }
.markdown-content :deep(p:first-child) { margin-top: 0; }
.markdown-content :deep(p:last-child) { margin-bottom: 0; }
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) { margin: 1rem 0 0.5rem; font-weight: 700; line-height: 1.35; }
.markdown-content :deep(h1) { font-size: 1.25rem; }
.markdown-content :deep(h2) { font-size: 1.125rem; }
.markdown-content :deep(h3) { font-size: 1rem; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { margin: 0.5rem 0; padding-left: 1.5rem; }
.markdown-content :deep(ul) { list-style: disc; }
.markdown-content :deep(ol) { list-style: decimal; }
.markdown-content :deep(li + li) { margin-top: 0.25rem; }
.markdown-content :deep(a) { color: #2563eb; text-decoration: underline; }
.markdown-content :deep(strong) { font-weight: 700; }
.markdown-content :deep(blockquote) { margin: 0.75rem 0; border-left: 3px solid #d4d4d4; padding-left: 0.75rem; color: #525252; }
.markdown-content :deep(code) { border-radius: 0.25rem; background: #f5f5f5; padding: 0.125rem 0.3rem; font-family: ui-monospace, monospace; font-size: 0.875em; }
.markdown-content :deep(pre) { overflow-x: auto; margin: 0.75rem 0; border-radius: 0.5rem; background: #171717; padding: 0.75rem; color: #f5f5f5; }
.markdown-content :deep(pre code) { background: transparent; padding: 0; color: inherit; }
.markdown-content :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 0.75rem 0; }
.markdown-content :deep(th), .markdown-content :deep(td) { border: 1px solid #e5e5e5; padding: 0.4rem 0.6rem; text-align: left; }
.markdown-content :deep(th) { background: #f5f5f5; font-weight: 600; }
.markdown-content :deep(hr) { margin: 1rem 0; border-color: #e5e5e5; }
@media (max-width: 767px) {
  .chat-shell { grid-template-columns: minmax(0, 1fr); height: auto; min-height: calc(100dvh - 150px); }
  .chat-shell > aside { max-height: 320px; }
  .chat-shell > div { height: max(540px, calc(100dvh - 170px)); }
}
</style>
