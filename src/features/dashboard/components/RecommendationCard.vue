<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/lib/api/http'
import { useSessionTokenStore } from '@/stores/session-token.store'

type Recommendation = {
  id: number
  titulo: string
  mensagem: string
  acao: 'revisar_gastos' | 'acompanhar_orcamento' | 'revisar_investimento'
  expiraEm: number
}

const props = defineProps<{ area: 'nucleo' | 'investimentos' }>()
const router = useRouter()
const session = useSessionTokenStore()
const cards = ref<(Recommendation & { deadline: number })[]>([])
const processing = ref<number>()
const error = ref<number>()
const heading = computed(() => `recommendation-${props.area}`)
let pending: AbortController | undefined
let polling: number | undefined
let expiry: number | undefined

function expire() {
  window.clearTimeout(expiry)
  const now = performance.now()
  cards.value = cards.value.filter(card => card.deadline > now)
  if (!cards.value.length) return
  expiry = window.setTimeout(expire, Math.max(1, Math.ceil(Math.min(...cards.value.map(card => card.deadline)) - now)))
}

async function refresh() {
  expire()
  if (!session.accessToken || document.hidden || pending || processing.value) return
  const request = new AbortController()
  pending = request
  const started = performance.now()
  try {
    const { data } = await http.get<{ recomendacoes: Recommendation[]; agora: number }>(
      '/v1/ia/recomendacoes/pendente', { params: { area: props.area }, signal: request.signal },
    )
    if (!request.signal.aborted) {
      cards.value = data.recomendacoes.map(card => ({ ...card, deadline: started + card.expiraEm - data.agora }))
      expire()
    }
  } catch {
    // A próxima consulta recupera falhas transitórias.
  } finally {
    if (pending === request) pending = undefined
  }
}

async function dismiss(card: Recommendation) {
  const token = session.accessToken
  if (!token || processing.value) return
  processing.value = card.id
  error.value = undefined
  pending?.abort()
  pending = undefined
  try {
    await http.post(`/v1/ia/recomendacoes/${card.id}/dispensar`)
    if (session.accessToken !== token) return
    cards.value = cards.value.filter(item => item.id !== card.id)
    expire()
  } catch {
    if (session.accessToken === token) error.value = card.id
  } finally {
    processing.value = undefined
  }
}

function review(card: Recommendation) {
  const name = card.acao === 'revisar_investimento' ? 'portfolio-assets'
    : card.acao === 'acompanhar_orcamento' ? 'dashboard' : 'transacoes'
  void router.push({ name })
}

watch(() => session.accessToken, () => {
  pending?.abort()
  pending = undefined
  cards.value = []
  error.value = undefined
  void refresh()
})

onMounted(() => {
  void refresh()
  document.addEventListener('visibilitychange', refresh)
  polling = window.setInterval(refresh, 60_000)
})

onUnmounted(() => {
  pending?.abort()
  document.removeEventListener('visibilitychange', refresh)
  window.clearInterval(polling)
  window.clearTimeout(expiry)
})
</script>

<template>
  <aside v-if="cards.length" :aria-labelledby="heading" class="min-w-0 space-y-3">
    <article
      v-for="card in cards"
      :key="card.id"
      class="flex min-w-0 flex-col gap-3 rounded-2xl bg-black p-5 text-white shadow-md"
    >
      <div class="flex items-center gap-2.5">
        <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15">
          <Sparkles class="size-4" aria-hidden="true" />
        </span>
        <h2 :id="card.id === cards[0]?.id ? heading : undefined" class="text-xs font-semibold uppercase tracking-wider text-neutral-300">
          Recomendação IA
        </h2>
      </div>
      <div role="status">
        <h3 class="font-semibold wrap-break-word">{{ card.titulo }}</h3>
        <p class="mt-1.5 text-sm leading-relaxed text-neutral-200 wrap-break-word">{{ card.mensagem }}</p>
      </div>
      <p v-if="error === card.id" role="alert" class="text-sm text-red-200">Não foi possível dispensar a sugestão. Tente novamente.</p>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-neutral-200" @click="review(card)">
          {{ card.acao === 'revisar_investimento' ? 'Ver ativos' : card.acao === 'acompanhar_orcamento' ? 'Ver painel' : 'Ver transações' }}
        </button>
        <button type="button" :disabled="processing !== undefined"
          class="rounded-xl px-3 py-2.5 text-sm text-neutral-200 hover:bg-white/15 disabled:opacity-60" @click="dismiss(card)">
          Dispensar
        </button>
      </div>
    </article>
  </aside>
</template>
