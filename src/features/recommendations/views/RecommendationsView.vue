<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import { http } from '@/lib/api/http'

type Recommendation = { id: number; titulo: string; mensagem: string; area: 'nucleo' | 'investimentos'; expiraEm: number }
const labels = { nucleo: 'Núcleo Financeiro', investimentos: 'Investimentos' }
const destinations = { nucleo: 'nucleo-financeiro', investimentos: 'investimentos' }
const cards = ref<Recommendation[]>([])
const next = ref<number | null>(null)
const loading = ref(false)
const error = ref(false)
const controller = new AbortController()
let polling: number | undefined

async function load(append = false) {
  if (loading.value) return
  loading.value = true
  error.value = false
  try {
    const { data } = await http.get<{ recomendacoes: Recommendation[]; proximo: number | null }>(
      '/v1/ia/recomendacoes/historico', {
        params: { antes: append ? next.value : undefined }, signal: controller.signal,
      },
    )
    cards.value = append ? [...cards.value, ...data.recomendacoes] : data.recomendacoes
    next.value = data.proximo
  } catch {
    if (!controller.signal.aborted) error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
  polling = window.setInterval(() => {
    if (!document.hidden && cards.value.length <= 20) void load()
  }, 60_000)
})
onUnmounted(() => {
  controller.abort()
  window.clearInterval(polling)
})
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <PageHeader title="Recomendações" subtitle="Histórico das recomendações que já passaram pelas suas telas." />

    <p v-if="loading && !cards.length" role="status" class="text-sm text-neutral-600">Carregando recomendações…</p>
    <p v-else-if="!cards.length && !error" class="text-sm text-neutral-600">Nenhuma recomendação no histórico.</p>

    <ul v-if="cards.length" class="grid items-start gap-4 md:grid-cols-2">
      <li v-for="card in cards" :key="card.id" class="space-y-3 rounded-2xl bg-black p-5 text-white shadow-md">
        <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-300">
          <Sparkles class="size-4" aria-hidden="true" /> {{ labels[card.area] }}
        </div>
        <h2 class="font-semibold wrap-break-word">{{ card.titulo }}</h2>
        <p class="text-sm leading-relaxed text-neutral-200 wrap-break-word">{{ card.mensagem }}</p>
        <RouterLink :to="{ name: destinations[card.area] }" class="inline-flex rounded-lg bg-white px-3 py-2 text-sm font-medium text-black">
          Abrir seção
        </RouterLink>
      </li>
    </ul>

    <div v-if="error" role="alert" class="space-y-2">
      <p class="text-sm text-red-700">Não foi possível carregar as recomendações.</p>
      <button type="button" class="rounded-lg border px-3 py-2 text-sm" @click="load(cards.length > 0)">Tentar novamente</button>
    </div>
    <button v-else-if="next !== null" type="button" :disabled="loading" class="rounded-lg border px-3 py-2 text-sm" @click="load(true)">
      Carregar mais
    </button>
  </main>
</template>
