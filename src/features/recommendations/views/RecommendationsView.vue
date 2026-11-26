<script setup lang="ts">
import { ArrowUpRight, CircleDollarSign, Clock3, Compass, FlaskConical, Layers3, MessageSquare, NotebookPen, Sparkles, Trash2, TrendingUp, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { toApiError } from '@/lib/api/types/api-error'
import { useSessionTokenStore } from '@/stores/session-token.store'
import { deleteRecommendation, listRecommendations } from '../services/recommendations.service'
import { previewText, type Recommendation, type RecommendationType } from '../types/recommendations.types'

const session = useSessionTokenStore()
const cards = ref<Recommendation[]>([])
const summary = ref({ total: 0, ativas: 0 })
const next = ref<number | null>(null)
const loading = ref(false)
const error = ref(false)
const retryAppend = ref(false)
const filter = ref<RecommendationType | 'todas'>('todas')
const selected = ref<Recommendation | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const latestRecommendationAt = ref<number>()
const hasLoadedMore = ref(false)
const filters: { key: RecommendationType | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'geral', label: 'Orientação geral' },
  { key: 'economia_mensal', label: 'Economia mensal' },
  { key: 'investimento', label: 'Investimentos' },
  { key: 'planejamento', label: 'Planejamento' },
  { key: 'outros', label: 'Outras oportunidades' },
]
const icons = { geral: Compass, economia_mensal: CircleDollarSign, investimento: TrendingUp, planejamento: NotebookPen, outros: Sparkles }
const count = new Intl.NumberFormat('pt-BR')
const generatedDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const recommendationTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const updatedLabel = computed(() => latestRecommendationAt.value
  ? recommendationTime.format(latestRecommendationAt.value) : '—')
let pending: AbortController | undefined
let polling: number | undefined
let opener: HTMLElement | undefined

const isDevelopment = import.meta.env.DEV
const exampleCards: Recommendation[] = [
  {
    id: -1, simulada: true, area: 'nucleo', tipo: 'economia_mensal', tipoLabel: 'Economia mensal',
    ativa: false, expiraEm: 0, acao: 'comparar_internet', titulo: 'Sua internet de R$ 120 pode custar menos',
    mensagem: 'No extrato simulado, apareceu uma cobrança de R$ 120,00 da Vivo por internet residencial. Se esse for o valor mensal, são R$ 1.440,00 em um ano.\n\nAbra a fatura e anote a velocidade, a fidelidade e o preço após a promoção. Compare duas ofertas disponíveis no seu CEP com a mesma velocidade.\n\nUm plano hipotético de R$ 100,00 por mês pouparia R$ 240,00 em um ano antes de taxas e multas. Leve os preços ao ChatBot para comparar o custo total.',
  },
  {
    id: -2, simulada: true, area: 'nucleo', tipo: 'planejamento', tipoLabel: 'Planejamento',
    ativa: false, expiraEm: 0, titulo: 'Reserve R$ 880 para os próximos vencimentos',
    mensagem: 'No cenário simulado, há R$ 1.400,00 na conta, uma fatura de R$ 560,00 e uma parcela de R$ 320,00 que vencem antes do próximo pagamento. Depois de reservar R$ 880,00, sobram R$ 520,00.\n\nAbra o calendário de pagamentos e confira se falta incluir alguma despesa fixa. Depois, divida o valor disponível pelas duas semanas restantes. A referência inicial é de R$ 260,00 por semana.',
  },
]
const previewCards = ref<Recommendation[]>([])
const visibleCards = computed(() => [
  ...previewCards.value.filter(card => filter.value === 'todas' || filter.value === card.tipo),
  ...cards.value,
])
const chatTopics = ['comparar_internet', 'comparar_telefonia', 'revisar_assinatura']
const chatTopic = computed(() => chatTopics.find(topic => topic === selected.value?.acao))
const confirmDelete = ref(false)
const deleteError = ref('')
const deleting = ref(false)
let deletion: AbortController | undefined
const listHeading = ref<HTMLElement | null>(null)

function togglePreview() {
  if (previewCards.value.length) {
    previewCards.value = []
    return
  }
  previewCards.value = [...exampleCards]
  filter.value = 'todas'
}

async function removeSelected() {
  const card = selected.value
  if (!card || deletion || !confirmDelete.value) return
  if (card.simulada) {
    previewCards.value = previewCards.value.filter(item => item.id !== card.id)
    closeDetails()
    return
  }
  const controller = new AbortController()
  deletion = controller
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteRecommendation(card.id, controller.signal)
    if (controller.signal.aborted) return
    pending?.abort()
    pending = undefined
    loading.value = false
    cards.value = cards.value.filter(item => item.id !== card.id)
    const total = Math.max(0, summary.value.total - 1)
    summary.value = { total, ativas: Math.max(0, summary.value.ativas - Number(card.ativa)) }
    if (total === 0) next.value = null
    closeDetails()
    if (!hasLoadedMore.value) void load()
  } catch (error) {
    if (!controller.signal.aborted) deleteError.value = toApiError(error).mensagem
  } finally {
    if (deletion === controller) {
      deletion = undefined
      deleting.value = false
    }
  }
}

async function load(append = false, refresh = false) {
  if (!session.accessToken || pending || (append && next.value === null)) return
  const token = session.accessToken
  const controller = new AbortController()
  pending = controller
  loading.value = true
  error.value = false
  retryAppend.value = append
  try {
    const data = await listRecommendations({
      before: append ? next.value ?? undefined : undefined,
      type: filter.value === 'todas' ? undefined : filter.value,
      signal: controller.signal,
    })
    if (controller.signal.aborted || token !== session.accessToken) return
    const lastOnFirstPage = data.recomendacoes.at(-1)?.id
    const keepOlder = refresh && hasLoadedMore.value && data.proximo !== null && lastOnFirstPage !== undefined &&
      data.recomendacoes.some(item => cards.value.some(card => card.id === item.id))
    const combined = append ? [...cards.value, ...data.recomendacoes]
      : keepOlder ? [...data.recomendacoes, ...cards.value.filter(item => item.id < lastOnFirstPage)]
        : data.recomendacoes
    cards.value = [...new Map(combined.map(card => [card.id, card])).values()]
    if (!keepOlder) next.value = data.proximo
    summary.value = data.resumo
    for (const { geradaEm } of data.recomendacoes) {
      if (geradaEm !== undefined && geradaEm > (latestRecommendationAt.value ?? 0)) {
        latestRecommendationAt.value = geradaEm
      }
    }
    if (!keepOlder) hasLoadedMore.value = append
  } catch {
    if (!controller.signal.aborted && token === session.accessToken) error.value = true
  } finally {
    if (pending === controller) {
      pending = undefined
      loading.value = false
    }
  }
}

function closeDetails() {
  if (dialog.value?.open) dialog.value.close()
  selected.value = null
}
function restoreFocus() {
  if (dialog.value?.open) return
  selected.value = null
  if (opener?.isConnected) opener.focus()
  else listHeading.value?.focus()
  opener = undefined
}
async function openDetails(card: Recommendation, event: MouseEvent) {
  opener = event.currentTarget as HTMLElement
  selected.value = card
  confirmDelete.value = false
  deleteError.value = ''
  await nextTick()
  if (!dialog.value?.open) dialog.value?.showModal()
}
function backdrop(event: MouseEvent) {
  if (event.target === dialog.value && !deleting.value) closeDetails()
}
function reset() {
  pending?.abort()
  pending = undefined
  loading.value = false
  cards.value = []
  next.value = null
  summary.value = { total: 0, ativas: 0 }
  error.value = false
  hasLoadedMore.value = false
  closeDetails()
  void load()
}
function refreshWhenVisible() {
  if (document.hidden || (error.value && retryAppend.value)) return
  void load(false, true)
}
watch(() => session.accessToken, () => {
  deletion?.abort()
  previewCards.value = []
  latestRecommendationAt.value = undefined
  reset()
})
watch(filter, reset)
onMounted(() => {
  void load()
  document.addEventListener('visibilitychange', refreshWhenVisible)
  polling = window.setInterval(refreshWhenVisible, 60_000)
})
onUnmounted(() => {
  deletion?.abort()
  pending?.abort()
  window.clearInterval(polling)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1456px] space-y-7 px-5 py-9 sm:px-8 lg:px-14 lg:py-11">
    <header class="space-y-3">
      <h1 ref="listHeading" tabindex="-1" class="flex items-center gap-2 text-2xl font-semibold tracking-tight text-neutral-900">
        <Sparkles class="size-5 shrink-0" aria-hidden="true" />
        Oportunidades da IA
      </h1>
      <p class="max-w-2xl text-sm leading-6 text-neutral-500">
        Orientações a partir da sua visão financeira, incluindo receita, despesas, contas, investimentos e dívidas.
        Selecione um cartão para ler a análise completa.
      </p>
    </header>

    <section v-if="isDevelopment" aria-labelledby="preview-heading"
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:px-6">
      <div class="flex items-center gap-4">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-800">
          <FlaskConical class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="preview-heading" class="text-sm font-semibold text-emerald-950">Prévia de recomendações</h2>
          <p class="mt-1 text-xs leading-5 text-emerald-900">Dois exemplos com dados fictícios para explorar os cartões.</p>
        </div>
      </div>
      <button type="button" :aria-pressed="!!previewCards.length"
        class="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-950"
        @click="togglePreview">
        {{ previewCards.length ? 'Ocultar exemplos' : 'Testar com dois exemplos' }}
        <ArrowUpRight v-if="!previewCards.length" class="size-3.5" aria-hidden="true" />
      </button>
    </section>

    <section aria-label="Resumo das recomendações" class="relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_3px_18px_rgba(0,0,0,0.035)]">
      <div aria-hidden="true" class="pointer-events-none absolute -right-5 -top-12 size-36 rounded-full bg-neutral-50" />
      <div class="relative grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p class="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
            <span class="grid size-6 place-items-center rounded-full bg-black text-white">
              <TrendingUp class="size-3.5" aria-hidden="true" />
            </span>
            Oportunidades identificadas
          </p>
          <p class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-semibold tracking-tight">{{ count.format(summary.total) }}</span>
            <span class="text-xs text-neutral-500">{{ summary.total === 1 ? 'recomendação' : 'recomendações' }}</span>
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4 rounded-xl bg-neutral-50 px-4 py-4">
          <div>
            <p class="flex items-center gap-1.5 text-xs font-semibold">
              <span class="size-1.5 rounded-full bg-black" />
              {{ count.format(summary.ativas) }} {{ summary.ativas === 1 ? 'ativa' : 'ativas' }}
            </p>
            <p class="mt-1 text-[11px] text-neutral-500">Em acompanhamento</p>
          </div>
          <div>
            <p class="flex items-center gap-1.5 text-xs font-semibold" data-testid="last-recommendation-time"
              :title="latestRecommendationAt ? generatedDate.format(latestRecommendationAt) : undefined">
              <Clock3 class="size-3.5" aria-hidden="true" /> {{ updatedLabel }}
            </p>
            <p class="mt-1 text-[11px] text-neutral-500">Última recomendação</p>
          </div>
        </div>
      </div>
    </section>

    <nav aria-label="Tipos de recomendação" class="flex flex-wrap gap-2">
      <button v-for="item in filters" :key="item.key" type="button"
        :aria-pressed="filter === item.key"
        class="rounded-full px-4 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        :class="filter === item.key ? 'bg-black text-white' : 'bg-neutral-200/80 text-neutral-600 hover:bg-neutral-200'"
        @click="filter = item.key">
        {{ item.label }}
      </button>
    </nav>

    <div v-if="loading && !visibleCards.length" role="status" aria-label="Carregando recomendações" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 3" :key="index" class="h-60 animate-pulse rounded-2xl bg-white" />
    </div>

    <div v-if="error" role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-5">
      <p class="text-sm text-neutral-600">Não foi possível carregar as recomendações. Seus dados continuam preservados.</p>
      <button type="button" :disabled="loading" class="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white disabled:opacity-50" @click="load(retryAppend)">
        Tentar novamente
      </button>
    </div>

    <div v-if="!loading && !error && !visibleCards.length" class="rounded-2xl border border-dashed border-neutral-200 px-6 py-14 text-center">
      <Layers3 class="mx-auto size-8 text-neutral-400" aria-hidden="true" />
      <h2 class="mt-4 text-base font-medium">Nenhuma oportunidade por aqui ainda</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
        {{ filter === 'todas' || filter === 'geral'
          ? 'Conecte uma conta e aguarde a sincronização dos dados para receber uma orientação na próxima análise.'
          : 'Ainda não há recomendações nesta categoria.' }}
      </p>
      <div v-if="filter === 'todas' || filter === 'geral'" class="mt-5 flex flex-wrap justify-center gap-3">
        <RouterLink :to="{ name: 'connect-bank' }" class="rounded-lg bg-black px-4 py-2 text-xs font-medium text-white">Conectar banco</RouterLink>
      </div>
    </div>

    <ul v-if="visibleCards.length" class="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
      <li v-for="card in visibleCards" :key="card.id" class="min-w-0">
        <button type="button" data-testid="recommendation-card" aria-haspopup="dialog"
          :aria-label="'Ler recomendação: ' + card.titulo"
          class="flex h-full min-h-60 w-full flex-col items-start rounded-2xl border border-transparent bg-white p-5 text-left shadow-[0_3px_18px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          @click="openDetails(card, $event)">
          <span class="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide"
            :class="card.simulada ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-600'">
            <component :is="icons[card.tipo] ?? Sparkles" class="size-3 shrink-0" aria-hidden="true" />
            {{ card.simulada ? 'Exemplo · ' : '' }}{{ card.tipoLabel }}
          </span>
          <span class="mt-4 line-clamp-2 text-base font-medium leading-6 text-neutral-900 wrap-break-word">{{ card.titulo }}</span>
          <span data-testid="recommendation-preview" class="mt-2 line-clamp-4 text-sm leading-6 text-neutral-500 wrap-break-word">{{ previewText(card.mensagem) }}</span>
          <span class="mt-auto flex w-full items-center justify-between gap-2 pt-4 text-xs text-neutral-600">
            <span v-if="card.geradaEm !== undefined">Gerada em {{ generatedDate.format(card.geradaEm) }}</span>
            <span v-else>Ler análise</span>
            <ArrowUpRight class="size-4 shrink-0" aria-hidden="true" />
          </span>
        </button>
      </li>
    </ul>

    <div v-if="next !== null && !error" class="text-center">
      <button type="button" :disabled="loading" class="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-medium disabled:opacity-50" @click="load(true)">
        {{ loading ? 'Carregando…' : 'Carregar mais recomendações' }}
      </button>
    </div>

    <dialog ref="dialog" aria-labelledby="recommendation-detail-title" class="recommendation-dialog"
      @close="restoreFocus" @click="backdrop" @cancel="deleting && $event.preventDefault()">
      <section v-if="selected" class="p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
            <component :is="icons[selected.tipo] ?? Sparkles" class="size-3.5" aria-hidden="true" /> {{ selected.simulada ? 'Exemplo · ' : '' }}{{ selected.tipoLabel }}
          </span>
          <button type="button" autofocus aria-label="Fechar recomendação" :disabled="deleting" class="-mr-1 -mt-1 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black" @click="closeDetails">
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>
        <h2 id="recommendation-detail-title" class="mt-6 text-xl font-semibold leading-8 text-neutral-900 wrap-break-word">{{ selected.titulo }}</h2>
        <p data-testid="recommendation-full-message" class="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-600 wrap-break-word">{{ selected.mensagem }}</p>
        <RouterLink v-if="chatTopic && !confirmDelete" :to="{ name: 'chat-ia', query: { assunto: chatTopic } }"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700">
          <MessageSquare class="size-4" aria-hidden="true" /> Comparar no ChatBot
        </RouterLink>
        <div class="mt-6 border-t border-neutral-100 pt-5">
          <button v-if="!confirmDelete" type="button"
            class="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
            @click="confirmDelete = true">
            <Trash2 class="size-4" aria-hidden="true" /> {{ selected.simulada ? 'Remover exemplo' : 'Excluir recomendação' }}
          </button>
          <div v-else class="space-y-3" role="group" aria-label="Confirmar exclusão">
            <p class="text-sm text-neutral-700">{{ selected.simulada ? 'Remover este exemplo da prévia?' : 'Excluir este cartão do seu histórico?' }}</p>
            <p v-if="deleteError" role="alert" class="text-sm text-red-700">{{ deleteError }}</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" :disabled="deleting" class="rounded-lg border border-neutral-200 px-3 py-2 text-sm" @click="confirmDelete = false">Cancelar</button>
              <button type="button" :disabled="deleting" class="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                @click="removeSelected">{{ deleting ? 'Excluindo…' : 'Confirmar exclusão' }}</button>
            </div>
          </div>
        </div>
      </section>
    </dialog>
  </div>
</template>

<style scoped>
.recommendation-dialog {
  width: min(640px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: 24px;
  background: white;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgb(0 0 0 / 18%);
}
.recommendation-dialog::backdrop { background: rgb(0 0 0 / 40%); backdrop-filter: blur(3px); }
</style>
