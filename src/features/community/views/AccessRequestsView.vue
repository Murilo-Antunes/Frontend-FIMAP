<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import { listarSolicitacoesRecebidas, responderSolicitacao } from '../services/profile.service'
import type { SolicitacaoRecebida } from '../types/profile.types'
import { formatarDataSegura } from '../utils/format-safe'

const auth = useAuthStore()
const idUsuario = computed(() => auth.usuario?.id ?? 0)

const solicitacoes = ref<SolicitacaoRecebida[]>([])
const carregando = ref(true)
const erro = ref<string | null>(null)
const erroAcao = ref<string | null>(null)
const processando = ref<number[]>([])

const rotuloTipo = (tipo: SolicitacaoRecebida['tipo']) =>
  tipo === 'seguir' ? 'Quer seguir você' : 'Quer se conectar com você'

async function carregar() {
  if (!idUsuario.value) return
  carregando.value = true
  erro.value = null
  try {
    const lista = await listarSolicitacoesRecebidas(idUsuario.value)
    solicitacoes.value = Array.isArray(lista) ? lista : []
  } catch (e) {
    console.error('Erro ao carregar solicitações:', e)
    erro.value = 'Não foi possível carregar as solicitações agora. Tente novamente em instantes.'
  } finally {
    carregando.value = false
  }
}

/** Tira da lista na hora e devolve se a API falhar. */
async function responder(solicitacao: SolicitacaoRecebida, decisao: 'aceitar' | 'recusar') {
  if (processando.value.includes(solicitacao.id)) return
  erroAcao.value = null
  processando.value = [...processando.value, solicitacao.id]
  const anterior = solicitacoes.value
  solicitacoes.value = anterior.filter((s) => s.id !== solicitacao.id)

  try {
    await responderSolicitacao(idUsuario.value, solicitacao.id, decisao)
  } catch (e) {
    console.error('Erro ao responder solicitação:', e)
    solicitacoes.value = anterior
    erroAcao.value = 'Não foi possível responder agora. Tente novamente.'
  } finally {
    processando.value = processando.value.filter((id) => id !== solicitacao.id)
  }
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-[60px]">
    <div class="max-w-3xl">
      <h1 class="text-xl font-semibold text-neutral-900">Solicitações de acesso</h1>
      <p class="mt-1 text-sm leading-relaxed text-neutral-500">
        Quem pediu para ver seu perfil privado. Os pedidos expiram em 30 dias.
      </p>

      <p v-if="erroAcao" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ erroAcao }}
      </p>

      <div v-if="carregando" class="py-16 text-center text-sm text-neutral-500">Carregando…</div>

      <div v-else-if="erro" class="flex flex-col items-center gap-3 py-16 text-center">
        <p class="text-sm text-neutral-500">{{ erro }}</p>
        <button
          type="button"
          class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          @click="carregar"
        >
          Tentar novamente
        </button>
      </div>

      <p v-else-if="!solicitacoes.length" class="mt-8 rounded-2xl bg-white px-6 py-10 text-center text-sm text-neutral-500 shadow-sm">
        Nenhuma solicitação pendente.
      </p>

      <ul v-else class="mt-6 rounded-2xl bg-white shadow-sm">
        <template v-for="(solicitacao, i) in solicitacoes" :key="solicitacao.id">
          <li v-if="i > 0"><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div class="flex min-w-0 items-center gap-3">
              <UserAvatar :src="solicitacao.foto_perfil" :name="solicitacao.nome_exibicao" size="md" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-neutral-900">{{ solicitacao.nome_exibicao }}</p>
                <p class="truncate text-xs text-neutral-500">
                  <span v-if="solicitacao.username_social">@{{ solicitacao.username_social }} · </span>
                  {{ rotuloTipo(solicitacao.tipo) }} ·
                  {{ formatarDataSegura(solicitacao.data_criacao, { day: '2-digit', month: 'short' }) }}
                </p>
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                :disabled="processando.includes(solicitacao.id)"
                class="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-60"
                @click="responder(solicitacao, 'recusar')"
              >
                Recusar
              </button>
              <button
                type="button"
                :disabled="processando.includes(solicitacao.id)"
                class="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                @click="responder(solicitacao, 'aceitar')"
              >
                Aceitar
              </button>
            </div>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
