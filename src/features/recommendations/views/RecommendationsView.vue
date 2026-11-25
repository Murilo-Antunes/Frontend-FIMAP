<script setup lang="ts">
import { CircleDollarSign, Clock3, Layers3, NotebookPen, Sparkles, TrendingUp, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { toApiError } from '@/lib/api/types/api-error'
import { useSessionTokenStore } from '@/stores/session-token.store'
import { createRecommendationPreview, listRecommendations } from '../services/recommendations.service'
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
const updatedAt = ref<number>()
const hasLoadedMore = ref(false)
const filters: { key: RecommendationType | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'economia_mensal', label: 'Economia mensal' },
  { key: 'investimento', label: 'Investimentos' },
  { key: 'planejamento', label: 'Planejamento' },
  { key: 'outros', label: 'Outras oportunidades' },
]
const icons = { economia_mensal: CircleDollarSign, investimento: TrendingUp, planejamento: NotebookPen, outros: Sparkles }
const count = new Intl.NumberFormat('pt-BR')
const updatedLabel = computed(() => updatedAt.value
  ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(updatedAt.value) : '—')
let pending: AbortController | undefined
let polling: number | undefined
let opener: HTMLElement | undefined

const isDevelopment = import.meta.env.DEV
const previewCard = ref<Recommendation | null>(null)
const previewLoading = ref(false)
const previewError = ref('')
let previewRequest: AbortController | undefined
const visibleCards = computed(() => previewCard.value &&
  (filter.value === 'todas' || filter.value === previewCard.value.tipo)
  ? [previewCard.value, ...cards.value] : cards.value)

async function runPreview() {
  if (!isDevelopment || !session.accessToken || previewLoading.value) return
  const token = session.accessToken
  const controller = new AbortController()
  previewRequest = controller
  previewLoading.value = true
  previewError.value = ''
  try {
    const result = await createRecommendationPreview(controller.signal)
    if (controller.signal.aborted || token !== session.accessToken) return
    previewCard.value = result.recomendacao
    filter.value = 'todas'
  } catch (error) {
    if (!controller.signal.aborted && token === session.accessToken) previewError.value = toApiError(error).mensagem
  } finally {
    if (previewRequest === controller) {
      previewRequest = undefined
      previewLoading.value = false
    }
  }
}
function clearPreview() {
  previewRequest?.abort()
  previewRequest = undefined
  previewLoading.value = false
  previewCard.value = null
  previewError.value = ''
}

async function load(append = false) {
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
    const combined = append ? [...cards.value, ...data.recomendacoes] : data.recomendacoes
    cards.value = [...new Map(combined.map(card => [card.id, card])).values()]
    next.value = data.proximo
    summary.value = data.resumo
    updatedAt.value = data.agora
    if (append) hasLoadedMore.value = true
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
  opener = undefined
}
async function openDetails(card: Recommendation, event: MouseEvent) {
  opener = event.currentTarget as HTMLElement
  selected.value = card
  await nextTick()
  if (!dialog.value?.open) dialog.value?.showModal()
}
function backdrop(event: MouseEvent) {
  if (event.target === dialog.value) closeDetails()
}
function reset() {
  pending?.abort()
  pending = undefined
  loading.value = false
  cards.value = []
  next.value = null
  summary.value = { total: 0, ativas: 0 }
  updatedAt.value = undefined
  error.value = false
  hasLoadedMore.value = false
  closeDetails()
  void load()
}
function refreshWhenVisible() {
  if (!document.hidden && !hasLoadedMore.value && !dialog.value?.open) void load()
}
watch(() => session.accessToken, () => { clearPreview(); reset() })
watch(filter, reset)
onMounted(() => {
  void load()
  document.addEventListener('visibilitychange', refreshWhenVisible)
  polling = window.setInterval(refreshWhenVisible, 60_000)
})
onUnmounted(() => {
  clearPreview()
  pending?.abort()
  window.clearInterval(polling)
  document.removeEventListener('visibilitychange', refreshWhenVisible)
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1456px] space-y-7 px-5 py-9 sm:px-8 lg:px-14 lg:py-11">
    <header class="space-y-3">
      <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight text-neutral-900">
        <Sparkles class="size-5 shrink-0" aria-hidden="true" />
        Oportunidades da IA
      </h1>
      <p class="max-w-2xl text-sm leading-6 text-neutral-500">
        Recomendações identificadas a partir dos seus dados do Open Finance.
        Selecione um cartão para ler a análise completa.
      </p>
    </header>

    <section v-if="isDevelopment" aria-label="Teste da recomendação" class="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="max-w-2xl">
          <h2 class="text-sm font-semibold">Teste com dados simulados</h2>
          <p class="mt-1 text-xs leading-5 text-neutral-500">
            Envia ao Worker um exemplo de mensalidade de R$ 100 para R$ 120 e mostra a resposta aqui.
            Não consulta sua conta bancária e não salva no banco.
          </p>
        </div>
        <button type="button" :disabled="previewLoading" class="rounded-xl bg-black px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50" @click="runPreview">
          {{ previewLoading ? 'Aguardando resposta…' : 'Testar resposta da IA' }}
        </button>
      </div>
      <p v-if="previewError" role="alert" class="text-sm text-red-700">{{ previewError }}</p>
      <p v-if="previewCard" role="status" class="text-xs leading-5 text-neutral-600">
        Cartão temporário gerado. Origem: <strong>{{ previewCard.origem === 'ia' ? 'IA' : 'regra automática' }}</strong>.
        Ele não entra nas contagens e desaparece ao sair da página.
      </p>
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
            <p class="flex items-center gap-1.5 text-xs font-semibold">
              <Clock3 class="size-3.5" aria-hidden="true" /> {{ updatedLabel }}
            </p>
            <p class="mt-1 text-[11px] text-neutral-500">Última consulta</p>
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
        As recomendações aparecem quando a análise encontra uma mudança relevante nos dados sincronizados.
      </p>
    </div>

    <ul v-if="visibleCards.length" class="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
      <li v-for="card in visibleCards" :key="card.id" class="min-w-0">
        <button type="button" data-testid="recommendation-card" aria-haspopup="dialog"
          :aria-label="'Ler recomendação: ' + card.titulo"
          class="flex h-full min-h-60 w-full flex-col items-start rounded-2xl border border-transparent bg-white p-5 text-left shadow-[0_3px_18px_rgba(0,0,0,0.035)] transition hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          @click="openDetails(card, $event)">
          <span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
            <component :is="icons[card.tipo] ?? Sparkles" class="size-3 shrink-0" aria-hidden="true" />
            {{ card.simulada ? 'Teste · ' : '' }}{{ card.tipoLabel }}
          </span>
          <span class="mt-4 line-clamp-2 text-base font-medium leading-6 text-neutral-900 wrap-break-word">{{ card.titulo }}</span>
          <span data-testid="recommendation-preview" class="mt-2 line-clamp-4 text-sm leading-6 text-neutral-500 wrap-break-word">{{ previewText(card.mensagem) }}</span>
          <span class="mt-auto pt-4 text-[10px] font-medium uppercase tracking-wide text-neutral-400">Análise financeira</span>
        </button>
      </li>
    </ul>

    <div v-if="next !== null && !error" class="text-center">
      <button type="button" :disabled="loading" class="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-medium disabled:opacity-50" @click="load(true)">
        {{ loading ? 'Carregando…' : 'Carregar mais recomendações' }}
      </button>
    </div>

    <dialog ref="dialog" aria-labelledby="recommendation-detail-title" class="recommendation-dialog" @close="restoreFocus" @click="backdrop">
      <section v-if="selected" class="p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
            <component :is="icons[selected.tipo] ?? Sparkles" class="size-3.5" aria-hidden="true" /> {{ selected.simulada ? 'Teste · ' : '' }}{{ selected.tipoLabel }}
          </span>
          <button type="button" autofocus aria-label="Fechar recomendação" class="-mr-1 -mt-1 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black" @click="closeDetails">
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>
        <h2 id="recommendation-detail-title" class="mt-6 text-xl font-semibold leading-8 text-neutral-900 wrap-break-word">{{ selected.titulo }}</h2>
        <p data-testid="recommendation-full-message" class="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-600 wrap-break-word">{{ selected.mensagem }}</p>
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
