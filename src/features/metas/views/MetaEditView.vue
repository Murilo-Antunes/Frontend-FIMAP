<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Pause, Play, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { metasService } from '../services/metas.service'
import { categoriasService } from '../services/categorias.service'
import { contasRendimentoService } from '../services/contas-rendimento.service'
import type { CategoriaMeta, ContaRendimento, Meta } from '../types/metas.types'
import {
  dataParaMonthInput,
  formatarMoeda,
  mapearMetaApi,
  mesesRestantes,
  monthInputParaData,
  percentualProgresso,
} from '../utils/metas.utils'
import { calcularProjecaoIA } from '../composables/useProjecaoIA'
import SeletorCategoriaPills from '../components/SeletorCategoriaPills.vue'
import SeletorContaRendimento from '../components/SeletorContaRendimento.vue'
import CardProjecaoEdicao from '../components/CardProjecaoEdicao.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const idMeta = Number(route.params.id)

const carregando = ref(true)
const salvando = ref(false)
const erroGeral = ref<string | null>(null)

const metaOriginal = ref<Meta | null>(null)
const categorias = ref<CategoriaMeta[]>([])
const contas = ref<ContaRendimento[]>([])

const nomeObjetivo = ref('')
const dataAlvo = ref('')
const aporteMensal = ref<number>(0)
const categoriaId = ref<number | null>(null)
const valorDesejado = ref<number>(0)
const idContaVinculada = ref<number | null>(null)

const percentual = computed(() =>
  metaOriginal.value ? percentualProgresso({ valorTotal: metaOriginal.value.valorTotal, valorDesejado: valorDesejado.value }) : 0,
)
const mesesRestantesAtual = computed(() => (dataAlvo.value ? mesesRestantes(monthInputParaData(dataAlvo.value)) : 0))
const pausada = computed(() => metaOriginal.value?.status === 0)

const projecaoAtualizada = computed(() =>
  calcularProjecaoIA({
    valorAtual: metaOriginal.value?.valorTotal ?? 0,
    valorDesejado: valorDesejado.value,
    aporteMensal: aporteMensal.value,
    percentualCdi: contas.value.find((c) => c.id === idContaVinculada.value)?.percentualCdi,
  }),
)
const projecaoOriginal = computed(() =>
  metaOriginal.value
    ? calcularProjecaoIA({
        valorAtual: metaOriginal.value.valorTotal,
        valorDesejado: metaOriginal.value.valorDesejado,
        aporteMensal: metaOriginal.value.aporteMensal,
        percentualCdi: contas.value.find((c) => c.id === metaOriginal.value?.idContaVinculada)?.percentualCdi,
      })
    : null,
)
const mesesAntecipados = computed(() =>
  Math.max((projecaoOriginal.value?.mesesEstimados ?? 0) - projecaoAtualizada.value.mesesEstimados, 0),
)

async function carregar() {
  carregando.value = true
  try {
    const idUsuario = authStore.usuario?.id
    const [metaApi, categoriasApi, contasApi] = await Promise.all([
      metasService.buscarPorId(idUsuario??0, idMeta),
      categoriasService.listar(idUsuario??0),
      contasRendimentoService.listar(idUsuario??0),
    ])

    const meta = mapearMetaApi(metaApi)
    metaOriginal.value = meta
    categorias.value = categoriasApi
    contas.value = contasApi

    nomeObjetivo.value = meta.nome
    dataAlvo.value = dataParaMonthInput(meta.dataAlvo)
    aporteMensal.value = meta.aporteMensal
    categoriaId.value = meta.idCategoria
    valorDesejado.value = meta.valorDesejado
    idContaVinculada.value = meta.idContaVinculada
  } catch (e) {
    erroGeral.value = 'Não foi possível carregar essa meta.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

function adicionarValor(valor: number) {
  valorDesejado.value = Number(valorDesejado.value) + valor
}

async function salvar() {
  if (!metaOriginal.value) return
  salvando.value = true
  erroGeral.value = null
  try {
    const idUsuario = authStore.usuario?.id
    await metasService.atualizar(idUsuario??0, metaOriginal.value.id, {
      nome: nomeObjetivo.value,
      data_alvo: monthInputParaData(dataAlvo.value).toISOString(),
      aporte_mensal: aporteMensal.value,
      id_categoria: categoriaId.value ?? undefined,
      valor_desejado: valorDesejado.value,
      id_conta_vinculada: idContaVinculada.value,
    })
    router.push({ name: 'metas' })
  } catch (e) {
    erroGeral.value = 'Não foi possível salvar as alterações agora.'
  } finally {
    salvando.value = false
  }
}

async function alternarPausa() {
  if (!metaOriginal.value) return
  try {
    const idUsuario = authStore.usuario?.id
    const novoStatus = metaOriginal.value.status === 1 ? 0 : 1
    await metasService.alterarStatus(idUsuario??0, metaOriginal.value.id, novoStatus)
    metaOriginal.value = { ...metaOriginal.value, status: novoStatus }
  } catch (e) {
    erroGeral.value = 'Não foi possível atualizar o status da meta.'
  }
}

async function excluir() {
  if (!metaOriginal.value) return
  const confirmado = window.confirm('Tem certeza que deseja excluir esta meta? Essa ação não pode ser desfeita.')
  if (!confirmado) return
  try {
    const idUsuario = authStore.usuario?.id
    await metasService.excluir(idUsuario??0, metaOriginal.value.id)
    router.push({ name: 'metas' })
  } catch (e) {
    erroGeral.value = 'Não foi possível excluir a meta agora.'
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-8">
    <div v-if="carregando" class="text-center text-sm text-gray-400">Carregando meta…</div>

    <template v-else-if="metaOriginal">
      <h1 class="text-2xl font-semibold text-gray-900">Editar Meta</h1>
      <p class="text-sm text-gray-400">Atualize valores, prazos, aportes ou altere a estratégia inteligente da sua meta.</p>

      <div class="mt-4 flex items-center justify-between">
        <span
          class="rounded-full px-3 py-1 text-xs font-medium"
          :class="pausada ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'"
        >
          ● {{ pausada ? 'Pausada' : 'Em andamento' }}
        </span>
      </div>

      <div class="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">{{ metaOriginal.nome }}</h2>
          <span class="text-sm font-semibold text-gray-700">{{ percentual }}%</span>
        </div>
        <div class="mt-2 flex items-center justify-between text-sm">
          <span class="text-gray-400">
            Acumulado: <span class="font-semibold text-gray-900">{{ formatarMoeda(metaOriginal.valorTotal) }}</span>
          </span>
          <span class="text-gray-400">Objetivo: {{ formatarMoeda(valorDesejado) }}</span>
        </div>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div class="h-full rounded-full bg-black" :style="{ width: `${percentual}%` }" />
        </div>
        <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>Faltam {{ formatarMoeda(Math.max(valorDesejado - metaOriginal.valorTotal, 0)) }}</span>
          <span>{{ mesesRestantesAtual }} meses restantes</span>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <div>
            <label class="text-xs font-medium tracking-wide text-gray-400">NOME DO OBJETIVO</label>
            <input
              v-model="nomeObjetivo"
              type="text"
              class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          <SeletorCategoriaPills v-model="categoriaId" :categorias="categorias" />

          <div>
            <label class="text-xs font-medium tracking-wide text-gray-400">VALOR TOTAL DA META (R$)</label>
            <input
              v-model.number="valorDesejado"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-lg font-semibold focus:border-gray-400 focus:outline-none"
            />
            <div class="mt-2 flex gap-2">
              <span class="text-xs text-gray-400 self-center">Ajustar:</span>
              <button
                v-for="chip in [1000, 5000, 10000]"
                :key="chip"
                type="button"
                class="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                @click="adicionarValor(chip)"
              >
                + R$ {{ chip.toLocaleString('pt-BR') }}
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-medium tracking-wide text-gray-400">DATA ALVO / PRAZO</label>
              <input
                v-model="dataAlvo"
                type="month"
                class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="text-xs font-medium tracking-wide text-gray-400">APORTE MENSAL ATUAL</label>
              <input
                v-model.number="aporteMensal"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <SeletorContaRendimento v-model="idContaVinculada" :contas="contas" :editavel="false" />
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <CardProjecaoEdicao :meses-antecipados="mesesAntecipados" @simular="carregar" />
        </div>

        <div class="space-y-3">
          <button
            type="button"
            :disabled="salvando"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
            @click="salvar"
          >
            {{ salvando ? 'Salvando…' : 'Salvar Alterações' }}
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="alternarPausa"
          >
            <component :is="pausada ? Play : Pause" class="h-4 w-4" />
            {{ pausada ? 'Retomar Meta' : 'Pausar Meta Temporariamente' }}
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-red-500 hover:text-red-600"
            @click="excluir"
          >
            <Trash2 class="h-4 w-4" />
            Excluir esta Meta Financeira
          </button>
        </div>
      </div>

      <p v-if="erroGeral" class="mt-4 text-sm text-red-500">{{ erroGeral }}</p>
    </template>

    <p v-else-if="erroGeral" class="text-sm text-red-500">{{ erroGeral }}</p>
  </div>
</template>
