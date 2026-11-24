<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Settings, Share2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import ProfileCard from '../components/ProfileCard.vue'
import BadgeCard from '../components/BadgeCard.vue'
import PostCard from '@/features/community/components/PostCard.vue'
import {
  buscarBadgesUsuario,
  buscarIdsBadgesDestaque,
  buscarPerfilPorId,
  buscarTodasBadges,
  listarComentariosPorUsuario,
  listarPostsInativos,
  listarPostsPorUsuario,
  listarPostsSalvos,
  listarSeguidores,
  listarSeguindo,
} from '../services/profile.service'
import type { AbaPerfil, BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import type { Post } from '@/features/community/types/community.types'

const router = useRouter()
const auth = useAuthStore()
const idUsuario = computed(() => auth.usuario?.id ?? 0)

const perfil = ref<PerfilUsuario | null>(null)
const minhasBadges = ref<BadgeUsuario[]>([])
const idsDestaque = ref<number[]>([])
const totalBadgesDisponiveis = ref(0)
const carregandoPerfil = ref(true)
const erroPerfil = ref<string | null>(null)

const ABAS: { id: AbaPerfil; label: string }[] = [
  { id: 'publicacoes', label: 'Publicações' },
  { id: 'respostas', label: 'Respostas' },
  { id: 'salvos', label: 'Salvos' },
  { id: 'arquivados', label: 'Arquivados' },
]

const abaAtiva = ref<AbaPerfil>('publicacoes')
const posts = ref<Post[]>([])
const arquivados = ref<Post[]>([])
const salvos = ref<Post[]>([])
const respostas = ref<Awaited<ReturnType<typeof listarComentariosPorUsuario>>['comentarios']>([])
const totalRespostas = ref(0)
const carregandoAba = ref(false)
const erroAba = ref<string | null>(null)

const badgesDestaque = computed<BadgeUsuario[]>(() => {
  if (idsDestaque.value.length) {
    return minhasBadges.value.filter((b) => idsDestaque.value.includes(b.id))
  }
  return minhasBadges.value.slice(0, 3)
})

const postsMaisRespostas = computed(() => posts.value.length + totalRespostas.value)

function contagem(aba: AbaPerfil) {
  if (aba === 'publicacoes') return posts.value.length
  if (aba === 'respostas') return totalRespostas.value
  if (aba === 'salvos') return salvos.value.length
  return arquivados.value.length
}

async function carregarPerfil() {
  if (!idUsuario.value) return
  carregandoPerfil.value = true
  erroPerfil.value = null
  try {
    const [dadosPerfil, badgesUsuario, todasBadges, destaques, seguidores, seguindoLista] = await Promise.all([
      buscarPerfilPorId(idUsuario.value),
      buscarBadgesUsuario(idUsuario.value),
      buscarTodasBadges(),
      buscarIdsBadgesDestaque(idUsuario.value),
      listarSeguidores(idUsuario.value),
      listarSeguindo(idUsuario.value),
    ])

    if (!dadosPerfil?.id) {
      erroPerfil.value = 'Não foi possível carregar seu perfil agora.'
      return
    }

    perfil.value = {
      ...dadosPerfil,
      total_seguidores: Array.isArray(seguidores) ? seguidores.length : dadosPerfil.total_seguidores,
      total_seguindo: Array.isArray(seguindoLista) ? seguindoLista.length : dadosPerfil.total_seguindo,
    }
    minhasBadges.value = Array.isArray(badgesUsuario) ? badgesUsuario : []
    totalBadgesDisponiveis.value = Array.isArray(todasBadges) ? todasBadges.length : 0
    idsDestaque.value = Array.isArray(destaques) ? destaques : []
  } catch (e) {
    console.error('Erro ao carregar perfil:', e)
    erroPerfil.value = 'Não foi possível carregar seu perfil agora. Tente novamente em instantes.'
  } finally {
    carregandoPerfil.value = false
  }
}

async function carregarAba(aba: AbaPerfil) {
  if (!idUsuario.value) return
  carregandoAba.value = true
  erroAba.value = null
  try {
    if (aba === 'publicacoes') {
      const resultado = await listarPostsPorUsuario(idUsuario.value, idUsuario.value)
      posts.value = Array.isArray(resultado) ? resultado : []
    } else if (aba === 'respostas') {
      const resultado = await listarComentariosPorUsuario(idUsuario.value)
      respostas.value = Array.isArray(resultado?.comentarios) ? resultado.comentarios : []
      totalRespostas.value = Number(resultado?.quantidade ?? 0)
    } else if (aba === 'salvos') {
      const resultado = await listarPostsSalvos(idUsuario.value)
      salvos.value = Array.isArray(resultado) ? resultado : []
    } else if (aba === 'arquivados') {
      const resultado = await listarPostsInativos(idUsuario.value)
      arquivados.value = Array.isArray(resultado) ? resultado : []
    }
  } catch (e) {
    console.error(`Erro ao carregar aba "${aba}":`, e)
    erroAba.value = 'Não foi possível carregar essa aba agora.'
  } finally {
    carregandoAba.value = false
  }
}

async function carregarContagensAbas() {
  if (!idUsuario.value) return

  const resultados = await Promise.allSettled([
    listarComentariosPorUsuario(idUsuario.value),
    listarPostsSalvos(idUsuario.value),
    listarPostsInativos(idUsuario.value),
  ])

  const [resultadoRespostas, resultadoSalvos, resultadoArquivados] = resultados

  if (resultadoRespostas.status === 'fulfilled') {
    respostas.value = Array.isArray(resultadoRespostas.value.comentarios)
      ? resultadoRespostas.value.comentarios
      : []
    totalRespostas.value = Number(resultadoRespostas.value.quantidade ?? respostas.value.length)
  }

  if (resultadoSalvos.status === 'fulfilled') {
    salvos.value = Array.isArray(resultadoSalvos.value) ? resultadoSalvos.value : []
  }

  if (resultadoArquivados.status === 'fulfilled') {
    arquivados.value = Array.isArray(resultadoArquivados.value) ? resultadoArquivados.value : []
  }

  resultados.forEach((resultado, index) => {
    if (resultado.status === 'rejected') {
      console.error(`Erro ao carregar contagem da aba ${['respostas', 'salvos', 'arquivados'][index]}:`, resultado.reason)
    }
  })
}

function selecionarAba(aba: AbaPerfil) {
  abaAtiva.value = aba
  carregarAba(aba)
}

function atualizarPostSalvo(idPost: number, salvo: boolean) {
  posts.value = posts.value.map((post) => post.id === idPost ? { ...post, salvo } : post)
  salvos.value = salvo
    ? salvos.value
    : salvos.value.filter((post) => post.id !== idPost)
}

function abrirPostDaResposta(idPost: number) {
  if (!idPost) return
  void router.push({ name: 'community-post', params: { id: idPost } })
}

function abrirEdicao() {
  // ⚠️ ajuste o nome da rota conforme a tela de edição que você já criou.
  router.push({ name: 'community-profile-edit' })
}

function voltar() {
  if (window.history.state?.back) router.back()
  else router.replace({ name: 'community' })
}

onMounted(async () => {
  await carregarPerfil()
  if (perfil.value) {
    await Promise.all([carregarAba('publicacoes'), carregarContagensAbas()])
  }
})
</script>

<template>
  <div class="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
    <div class="mb-4 flex items-center justify-between">
      <button
        type="button"
        class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
        @click="voltar"
      >
        <ArrowLeft :size="18" />
      </button>

      <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold tracking-wide text-neutral-600">
        COMUNIDADE FIMAP
      </span>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
          aria-label="Compartilhar perfil"
        >
          <Share2 :size="18" />
        </button>
        <RouterLink
          :to="{ name: 'community-settings' }"
          class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
          aria-label="Configurações do perfil"
        >
          <Settings :size="18" />
        </RouterLink>
      </div>
    </div>

    <div v-if="carregandoPerfil" class="py-20 text-center text-sm text-neutral-500">
      Carregando perfil…
    </div>

    <div v-else-if="erroPerfil" class="flex flex-col items-center gap-3 py-20 text-center">
      <p class="text-sm text-neutral-500">{{ erroPerfil }}</p>
      <button type="button" class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200" @click="carregarPerfil">
        Tentar novamente
      </button>
    </div>

    <div v-else-if="perfil" class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <ProfileCard
        :perfil="{ ...perfil, total_posts_respostas: postsMaisRespostas } as any"
        mode="own"
        @editar="abrirEdicao"
      />

      <div class="flex flex-col gap-6">
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-semibold text-neutral-900">Badges em Destaque</h2>
            <RouterLink
              :to="{ name: 'community-profile-badges' }"
              class="text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              Ver todas ({{ totalBadgesDisponiveis }})
            </RouterLink>
          </div>

          <div v-if="badgesDestaque.length" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <BadgeCard
              v-for="badge in badgesDestaque"
              :key="badge.id"
              :badge="badge"
              size="lg"
              checked
            />
          </div>
          <p v-else class="text-sm text-neutral-500">
            Você ainda não conquistou nenhuma badge.
          </p>
        </section>

        <section>
          <!-- Abas em texto simples com sublinhado no ativo — sem "pílula" de fundo. -->
          <div class="flex items-center gap-6 overflow-x-auto border-b border-neutral-200 text-sm">
            <button
              v-for="aba in ABAS"
              :key="aba.id"
              type="button"
              class="relative -mb-px whitespace-nowrap pb-3 font-medium transition"
              :class="abaAtiva === aba.id ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'"
              @click="selecionarAba(aba.id)"
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

          <div v-else-if="erroAba" class="flex flex-col items-center gap-3 py-10 text-center">
            <p class="text-sm text-neutral-500">{{ erroAba }}</p>
            <button type="button" class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200" @click="carregarAba(abaAtiva)">
              Tentar novamente
            </button>
          </div>

          <div v-else-if="abaAtiva === 'publicacoes'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PostCard v-for="post in posts" :key="post.id" :post="post" @saved-change="atualizarPostSalvo" />
            <p v-if="!posts.length" class="col-span-full text-sm text-neutral-500">
              Nenhuma publicação ainda.
            </p>
          </div>

          <div v-else-if="abaAtiva === 'respostas'" class="mt-4 flex flex-col gap-3">
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

          <div v-else-if="abaAtiva === 'salvos'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PostCard v-for="post in salvos" :key="post.id" :post="post" @saved-change="atualizarPostSalvo" />
            <p v-if="!salvos.length" class="col-span-full text-sm text-neutral-500">
              Nenhuma publicação salva ainda.
            </p>
          </div>

          <div v-else class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PostCard v-for="post in arquivados" :key="post.id" :post="post" />
            <p v-if="!arquivados.length" class="col-span-full text-sm text-neutral-500">
              Nenhuma publicação arquivada.
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
