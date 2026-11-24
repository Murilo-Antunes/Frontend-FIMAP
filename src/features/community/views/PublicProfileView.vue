<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Ban, MoreHorizontal, Share2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import ProfileCard from '../components/ProfileCard.vue'
import BadgeCard from '../components/BadgeCard.vue'
import PrivateProfile from '../components/PrivateProfile.vue'
import PostCard from '@/features/community/components/PostCard.vue'
import {
  bloquearUsuario,
  buscarBadgesUsuario,
  buscarEstadoSolicitacao,
  buscarPerfilPorUsername,
  buscarTodasBadges,
  cancelarSolicitacao,
  deixarDeSeguir,
  jaSegue,
  listarSeguidores,
  listarSeguindo,
  listarComentariosPorUsuario,
  listarPostsPorUsuario,
  seguir,
  solicitarAcesso,
} from '../services/profile.service'
import type { BadgeUsuario, EstadoSolicitacao, PerfilUsuario, TipoSolicitacao } from '../types/profile.types'
import type { Comentario, Post } from '@/features/community/types/community.types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const perfil = ref<PerfilUsuario | null>(null)
const badges = ref<BadgeUsuario[]>([])
const totalBadgesDisponiveis = ref(0)
const carregandoPerfil = ref(true)
const erro = ref<string | null>(null)

const seguindo = ref(false)
const seguindoBusy = ref(false)

// Perfil privado: o backend manda acesso_restrito; se não mandar, usamos visibilidade === 0.
const privado = computed(() => {
  if (!perfil.value) return false
  return perfil.value.acesso_restrito ?? Number(perfil.value.visibilidade) === 0
})
const estadoSolicitacao = ref<EstadoSolicitacao>('nenhuma')
const solicitando = ref(false)
const erroSolicitacao = ref<string | null>(null)

const ABAS = [
  { id: 'publicacoes', label: 'Publicações' },
  { id: 'respostas', label: 'Respostas' },
] as const

const abaAtiva = ref<'publicacoes' | 'respostas'>('publicacoes')
const posts = ref<Post[]>([])
const respostas = ref<Comentario[]>([])
const totalRespostas = ref(0)
const carregandoAba = ref(false)

const postsMaisRespostas = computed(() => posts.value.length + totalRespostas.value)

function contagem(aba: 'publicacoes' | 'respostas') {
  return aba === 'publicacoes' ? posts.value.length : totalRespostas.value
}

async function carregar(username: string) {
  carregandoPerfil.value = true
  erro.value = null
  erroSolicitacao.value = null
  estadoSolicitacao.value = 'nenhuma'
  try {
    const dadosPerfil = await buscarPerfilPorUsername(username)

    if (!dadosPerfil?.id) {
      erro.value = 'Usuário não encontrado.'
      return
    }

    if (dadosPerfil.id === auth.usuario?.id) {
      router.replace({ name: 'community-profile' })
      return
    }

    perfil.value = dadosPerfil

    // Perfil privado: não buscamos badges/posts/respostas — só o estado da solicitação.
    if (privado.value) {
      if (auth.usuario?.id) {
        estadoSolicitacao.value = await buscarEstadoSolicitacao(auth.usuario.id, dadosPerfil.id)
      }
      return
    }

    // Os totais do perfil v�m das listas atuais de relacionamento.
    const [seguidores, seguindoLista] = await Promise.all([
      listarSeguidores(dadosPerfil.id),
      listarSeguindo(dadosPerfil.id),
    ])
    perfil.value = {
      ...dadosPerfil,
      total_seguidores: Array.isArray(seguidores) ? seguidores.length : dadosPerfil.total_seguidores,
      total_seguindo: Array.isArray(seguindoLista) ? seguindoLista.length : dadosPerfil.total_seguindo,
    }
    const [badgesUsuario, todasBadges, resultadoRespostas] = await Promise.all([
      buscarBadgesUsuario(dadosPerfil.id),
      buscarTodasBadges(),
      listarComentariosPorUsuario(dadosPerfil.id),
    ])
    badges.value = Array.isArray(badgesUsuario) ? badgesUsuario : []
    totalBadgesDisponiveis.value = Array.isArray(todasBadges) ? todasBadges.length : 0
    respostas.value = Array.isArray(resultadoRespostas?.comentarios)
      ? resultadoRespostas.comentarios as Comentario[]
      : []
    totalRespostas.value = Number(resultadoRespostas?.quantidade ?? respostas.value.length)

    const resultadoPosts = await listarPostsPorUsuario(dadosPerfil.id, auth.usuario?.id)
    posts.value = Array.isArray(resultadoPosts) ? resultadoPosts : []

    if (auth.usuario?.id) {
      seguindo.value = await jaSegue(auth.usuario.id, dadosPerfil.id)
    }
  } catch (e) {
    console.error('Erro ao carregar perfil público:', e)
    erro.value = 'Não foi possível carregar esse perfil agora. Tente novamente em instantes.'
  } finally {
    carregandoPerfil.value = false
  }
}

function abrirPostDaResposta(idPost: number) {
  if (!idPost) return
  void router.push({ name: 'community-post', params: { id: idPost } })
}

async function alternarSeguir() {
  if (!perfil.value || !auth.usuario?.id || seguindoBusy.value) return
  seguindoBusy.value = true
  const anterior = seguindo.value
  seguindo.value = !anterior
  try {
    if (anterior) {
      await deixarDeSeguir(auth.usuario.id, perfil.value.id)
    } else {
      await seguir(auth.usuario.id, perfil.value.id)
    }
    // Atualiza a contagem do perfil aberto imediatamente; ao abrir o perfil
    // novamente, os totais são carregados das listas do backend.
    perfil.value = {
      ...perfil.value,
      total_seguidores: Math.max(0, Number(perfil.value.total_seguidores ?? 0) + (anterior ? -1 : 1)),
    }
  } catch {
    seguindo.value = anterior
  } finally {
    seguindoBusy.value = false
  }
}

async function solicitar(tipo: TipoSolicitacao) {
  if (!perfil.value || !auth.usuario?.id || solicitando.value) return
  solicitando.value = true
  erroSolicitacao.value = null
  try {
    await solicitarAcesso(auth.usuario.id, perfil.value.id, tipo)
    estadoSolicitacao.value = 'pendente'
  } catch (e) {
    console.error('Erro ao enviar solicitação:', e)
    erroSolicitacao.value = 'Não foi possível enviar a solicitação. Tente novamente.'
  } finally {
    solicitando.value = false
  }
}

async function cancelar() {
  if (!perfil.value || !auth.usuario?.id || solicitando.value) return
  solicitando.value = true
  erroSolicitacao.value = null
  try {
    await cancelarSolicitacao(auth.usuario.id, perfil.value.id)
    estadoSolicitacao.value = 'nenhuma'
  } catch (e) {
    console.error('Erro ao cancelar solicitação:', e)
    erroSolicitacao.value = 'Não foi possível cancelar a solicitação. Tente novamente.'
  } finally {
    solicitando.value = false
  }
}

// Menu "⋯" e bloqueio
const menuAberto = ref(false)
const confirmandoBloqueio = ref(false)
const bloqueando = ref(false)
const erroBloqueio = ref<string | null>(null)

async function confirmarBloqueio() {
  if (!perfil.value || !auth.usuario?.id || bloqueando.value) return
  bloqueando.value = true
  erroBloqueio.value = null
  try {
    await bloquearUsuario(auth.usuario.id, perfil.value.id)
    confirmandoBloqueio.value = false
    router.back()
  } catch (e) {
    console.error('Erro ao bloquear usuário:', e)
    erroBloqueio.value = 'Não foi possível bloquear agora. Tente novamente.'
  } finally {
    bloqueando.value = false
  }
}

watch(
  () => route.params.username as string,
  (username) => {
    if (username) carregar(username)
  },
  { immediate: true },
)
</script>

<template>
  <div class="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
    <!-- No perfil privado a barra de topo é a do próprio PrivateProfile. -->
    <div v-if="!(perfil && privado && !carregandoPerfil && !erro)" class="mb-4 flex items-center justify-between">
      <button
        type="button"
        class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
        @click="router.back()"
      >
        <ArrowLeft :size="18" />
      </button>

      <div class="flex items-center gap-1">
        <button type="button" class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100" aria-label="Compartilhar perfil">
          <Share2 :size="18" />
        </button>
        <div class="relative" @keydown.esc="menuAberto = false">
          <button
            type="button"
            class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
            aria-label="Mais opções"
            aria-haspopup="menu"
            :aria-expanded="menuAberto"
            @click="menuAberto = !menuAberto"
          >
            <MoreHorizontal :size="18" />
          </button>

          <template v-if="menuAberto">
            <button
              type="button"
              class="fixed inset-0 z-10 cursor-default"
              tabindex="-1"
              aria-label="Fechar menu"
              @click="menuAberto = false"
            />
            <ul role="menu" class="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl bg-white p-1 shadow-lg">
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-neutral-100"
                  @click="menuAberto = false; confirmandoBloqueio = true"
                >
                  <Ban :size="15" aria-hidden="true" /> Bloquear usuário
                </button>
              </li>
            </ul>
          </template>
        </div>
      </div>
    </div>

    <div v-if="carregandoPerfil" class="py-20 text-center text-sm text-neutral-500">
      Carregando perfil…
    </div>

    <div v-else-if="erro" class="flex flex-col items-center gap-3 py-20 text-center">
      <p class="text-sm text-neutral-500">{{ erro }}</p>
      <button
        type="button"
        class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
        @click="carregar(route.params.username as string)"
      >
        Tentar novamente
      </button>
    </div>

    <PrivateProfile
      v-else-if="perfil && privado"
      :perfil="perfil"
      :estado="estadoSolicitacao"
      :busy="solicitando"
      :erro="erroSolicitacao"
      @solicitar="solicitar"
      @cancelar="cancelar"
    />

    <div v-else-if="perfil" class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <ProfileCard
        :perfil="{ ...perfil, total_posts_respostas: postsMaisRespostas } as any"
        mode="public"
        :seguindo="seguindo"
        :seguindo-busy="seguindoBusy"
        @seguir="alternarSeguir"
      />

      <div class="flex flex-col gap-6">
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-900">Reputação e Badges</h2>
            <RouterLink
              :to="{ name: 'community-user-badges', params: { username: route.params.username } }"
              class="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              Ver todas ({{ totalBadgesDisponiveis }})
            </RouterLink>
          </div>

          <div v-if="badges.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BadgeCard v-for="badge in badges.slice(0, 4)" :key="badge.id" :badge="badge" />
          </div>
          <p v-else class="text-sm text-neutral-500">Ainda sem badges conquistadas.</p>
        </section>

        <section>
          <div class="flex items-center gap-6 border-b border-neutral-200 text-sm">
            <button
              v-for="aba in ABAS"
              :key="aba.id"
              type="button"
              class="relative -mb-px pb-3 font-medium transition"
              :class="abaAtiva === aba.id ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'"
              @click="abaAtiva = aba.id"
            >
              {{ aba.label }} ({{ contagem(aba.id) }})
              <span
                v-if="abaAtiva === aba.id"
                class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-neutral-900"
              />
            </button>
          </div>

          <div v-if="carregandoAba" class="py-10 text-center text-sm text-neutral-500">
            Carregando…
          </div>

          <div v-else-if="abaAtiva === 'publicacoes'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PostCard v-for="post in posts" :key="post.id" :post="post" />
            <p v-if="!posts.length" class="col-span-full text-sm text-neutral-500">
              Nenhuma publicação ainda.
            </p>
          </div>

          <div v-else class="mt-4 flex flex-col gap-3">
            <button
              v-for="resposta in respostas"
              :key="resposta.id"
              type="button"
              class="w-full rounded-2xl bg-white p-4 text-left text-sm text-neutral-800 shadow-sm transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              :disabled="!resposta.id_post"
              @click="abrirPostDaResposta(Number(resposta.id_post))"
            >
              {{ resposta.mensagem }}
              <span class="mt-2 block text-xs font-medium text-neutral-500">Ver publicação</span>
            </button>
            <p v-if="!respostas.length" class="text-sm text-neutral-500">
              Nenhuma resposta ainda.
            </p>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="confirmandoBloqueio"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-bloqueio"
      @click.self="confirmandoBloqueio = false"
      @keydown.esc="confirmandoBloqueio = false"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="titulo-bloqueio" class="text-base font-semibold text-neutral-900">
          Bloquear @{{ perfil?.username_social ?? 'usuário' }}?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-neutral-500">
          Essa pessoa não verá seu perfil, não poderá te seguir nem comentar nos seus posts, e vocês deixam de se
          seguir. Você pode desbloquear depois nas configurações.
        </p>
        <p v-if="erroBloqueio" class="mt-3 text-xs text-red-600" role="alert">{{ erroBloqueio }}</p>
        <div class="mt-5 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
            @click="confirmandoBloqueio = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="bloqueando"
            class="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            @click="confirmarBloqueio"
          >
            {{ bloqueando ? 'Bloqueando…' : 'Bloquear' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
