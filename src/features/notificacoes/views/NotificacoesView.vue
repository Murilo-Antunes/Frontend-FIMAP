<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BellOff, Check, CheckCheck, Trash2 } from 'lucide-vue-next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificacoesStore } from '@/stores/notificacoes.store'
import { toApiError } from '@/lib/api/types/api-error'
import { notificacoesService } from '../services/notificacoes.service'
import { resolveNotificationIcon } from '../utils/resolveIcon'
import type { FiltroNotificacao, Notificacao } from '../types/notificacoes.types'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const FILTROS: { valor: FiltroNotificacao; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'nao-lidas', label: 'Não lidas' },
  { valor: 'lidas', label: 'Lidas' },
]

const authStore = useAuthStore()
const notificacoesStore = useNotificacoesStore()

const notificacoes = ref<Notificacao[]>([])
const carregando = ref(false)
const erro = ref<string | null>(null)
const filtro = ref<FiltroNotificacao>('todas')
const processando = ref<number | null>(null)

const idUsuario = computed(() => authStore.usuario?.id)
const temNaoLidas = computed(() => notificacoes.value.some((n) => !n.lida))

async function carregar() {
  carregando.value = true
  erro.value = null
  try {
    const lida = filtro.value === 'todas' ? undefined : filtro.value === 'lidas'
    notificacoes.value = await notificacoesService.listarNotificacoes(idUsuario.value??0, lida)
  } catch (error) {
    erro.value = toApiError(error).mensagem
  } finally {
    carregando.value = false
  }
}

function selecionarFiltro(novo: FiltroNotificacao) {
  if (filtro.value === novo) return
  filtro.value = novo
  carregar()
}

async function marcarLida(notificacao: Notificacao) {
  if (notificacao.lida || processando.value) return
  processando.value = notificacao.id
  try {
    await notificacoesService.marcarComoLida(notificacao.id)
    notificacao.lida = true
    notificacoesStore.decrementar()
    if (filtro.value === 'nao-lidas') {
      notificacoes.value = notificacoes.value.filter((n) => n.id !== notificacao.id)
    }
  } catch (error) {
    erro.value = toApiError(error).mensagem
  } finally {
    processando.value = null
  }
}

async function marcarTodasLidas() {
  if (!temNaoLidas.value) return
  try {
    await notificacoesService.marcarTodasComoLidas(idUsuario.value??0)
    notificacoes.value = notificacoes.value.map((n) => ({ ...n, lida: true }))
    notificacoesStore.zerar()
  } catch (error) {
    erro.value = toApiError(error).mensagem
  }
}

async function excluir(notificacao: Notificacao) {
  processando.value = notificacao.id
  try {
    await notificacoesService.deletarNotificacao(notificacao.id)
    notificacoes.value = notificacoes.value.filter((n) => n.id !== notificacao.id)
    if (!notificacao.lida) notificacoesStore.decrementar()
  } catch (error) {
    erro.value = toApiError(error).mensagem
  } finally {
    processando.value = null
  }
}

function abrirNotificacao(notificacao: Notificacao) {
  // TODO: quando o redirecionamento para o post/entidade referenciada existir,
  // usar notificacao.tipoReferencia + notificacao.idReferencia para navegar.
  marcarLida(notificacao)
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8 sm:px-8">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900">Notificações</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Acompanhe as interações da comunidade e do sistema
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!temNaoLidas"
        @click="marcarTodasLidas"
      >
        <CheckCheck :size="16" />
        Marcar todas como lidas
      </button>
    </div>

    <div class="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1">
      <button
        v-for="opcao in FILTROS"
        :key="opcao.valor"
        type="button"
        class="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition"
        :class="filtro === opcao.valor ? 'bg-black text-white' : 'text-neutral-600 hover:bg-white'"
        @click="selecionarFiltro(opcao.valor)"
      >
        {{ opcao.label }}
      </button>
    </div>

    <div
      v-if="erro"
      class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ erro }}
      <button type="button" class="ml-2 font-medium underline" @click="carregar">
        Tentar novamente
      </button>
    </div>

    <div v-if="carregando" class="space-y-3">
      <div v-for="n in 4" :key="n" class="h-24 animate-pulse rounded-2xl bg-neutral-100" />
    </div>

    <div
      v-else-if="notificacoes.length === 0"
      class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-16 text-center"
    >
      <BellOff :size="32" class="text-neutral-300" />
      <p class="text-sm text-neutral-500">
        {{
          filtro === 'nao-lidas'
            ? 'Você não tem notificações não lidas'
            : 'Nenhuma notificação por aqui'
        }}
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="notificacao in notificacoes"
        :key="notificacao.id"
        class="group relative flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300"
        :class="{ 'bg-neutral-50/60': !notificacao.lida }"
      >
        <span
          v-if="!notificacao.lida"
          class="absolute left-2 top-5 h-2 w-2 rounded-full bg-blue-500"
          aria-hidden="true"
        />

        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
          @click="abrirNotificacao(notificacao)"
        >
          <component :is="resolveNotificationIcon(notificacao.icone)" :size="18" />
        </button>

        <button type="button" class="min-w-0 flex-1 text-left" @click="abrirNotificacao(notificacao)">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-sm font-semibold text-neutral-900">{{ notificacao.nome }}</p>
            <span class="shrink-0 text-xs text-neutral-400">
              {{ dayjs(notificacao.dataCriacao).fromNow() }}
            </span>
          </div>
          <p class="mt-1 text-sm text-neutral-600">{{ notificacao.conteudo }}</p>
        </button>

        <div class="flex shrink-0 items-start gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            v-if="!notificacao.lida"
            type="button"
            class="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            title="Marcar como lida"
            :disabled="processando === notificacao.id"
            @click="marcarLida(notificacao)"
          >
            <Check :size="16" />
          </button>
          <button
            type="button"
            class="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
            title="Excluir"
            :disabled="processando === notificacao.id"
            @click="excluir(notificacao)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
