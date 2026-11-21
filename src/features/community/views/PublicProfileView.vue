<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MoreHorizontal, Share2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import ProfileCard from '../components/ProfileCard.vue'
import BadgeCard from '../components/BadgeCard.vue'
import PostCard from '@/features/community/components/PostCard.vue'
import {
  buscarBadgesUsuario,
  buscarPerfilPorUsername,
  buscarTodasBadges,
  deixarDeSeguir,
  jaSegue,
  listarComentariosPorUsuario,
  listarPostsPorUsuario,
  seguir,
} from '../services/profile.service'
import type { BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import type { Post } from '@/features/community/types/community.types'

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

const abaAtiva = ref<'publicacoes' | 'respostas'>('publicacoes')
const posts = ref<Post[]>([])
const totalRespostas = ref(0)
const carregandoAba = ref(false)

const postsMaisRespostas = computed(() => posts.value.length + totalRespostas.value)

async function carregar(username: string) {
  carregandoPerfil.value = true
  erro.value = null
  try {
    const dadosPerfil = await buscarPerfilPorUsername(username)

    if (!dadosPerfil?.id) {
      erro.value = 'Usuário não encontrado.'
      return
    }

    // Se o usuário clicar no próprio avatar em algum lugar, manda pro perfil próprio.
    if (dadosPerfil.id === auth.usuario?.id) {
      router.replace({ name: 'community-profile' })
      return
    }

    perfil.value = dadosPerfil

    const [badgesUsuario, todasBadges, resultadoRespostas] = await Promise.all([
      buscarBadgesUsuario(dadosPerfil.id),
      buscarTodasBadges(),
      listarComentariosPorUsuario(dadosPerfil.id),
    ])
    badges.value = Array.isArray(badgesUsuario) ? badgesUsuario : []
    totalBadgesDisponiveis.value = Array.isArray(todasBadges) ? todasBadges.length : 0
    totalRespostas.value = Number(resultadoRespostas?.quantidade ?? 0)

    const resultadoPosts = await listarPostsPorUsuario(dadosPerfil.id)
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
  } catch {
    seguindo.value = anterior
  } finally {
    seguindoBusy.value = false
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
    <div class="mb-4 flex items-center justify-between">
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground transition hover:bg-neutral-100"
        @click="router.back()"
      >
        <ArrowLeft :size="18" />
      </button>

      <div class="flex items-center gap-2">
        <button type="button" class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100" aria-label="Compartilhar perfil">
          <Share2 :size="18" />
        </button>
        <button type="button" class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100" aria-label="Mais opções">
          <MoreHorizontal :size="18" />
        </button>
      </div>
    </div>

    <div v-if="carregandoPerfil" class="py-20 text-center text-sm text-muted-foreground">
      Carregando perfil…
    </div>

    <div v-else-if="erro" class="flex flex-col items-center gap-3 py-20 text-center">
      <p class="text-sm text-muted-foreground">{{ erro }}</p>
      <button
        type="button"
        class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium"
        @click="carregar(route.params.username as string)"
      >
        Tentar novamente
      </button>
    </div>

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
            <h2 class="text-base font-semibold text-foreground">Reputação e Badges</h2>
            <RouterLink
              :to="{ name: 'community-user-badges', params: { username: route.params.username } }"
              class="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Ver todas ({{ totalBadgesDisponiveis }})
            </RouterLink>
          </div>

          <div v-if="badges.length" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BadgeCard v-for="badge in badges.slice(0, 4)" :key="badge.id" :badge="badge" />
          </div>
          <p v-else class="text-sm text-muted-foreground">Ainda sem badges conquistadas.</p>
        </section>

        <section>
          <div class="flex gap-1 rounded-full bg-neutral-100 p-1 text-sm">
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 font-medium transition"
              :class="abaAtiva === 'publicacoes' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'"
              @click="abaAtiva = 'publicacoes'"
            >
              Publicações ({{ posts.length }})
            </button>
            <button
              type="button"
              class="rounded-full px-3.5 py-1.5 font-medium transition"
              :class="abaAtiva === 'respostas' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'"
              @click="abaAtiva = 'respostas'"
            >
              Respostas ({{ totalRespostas }})
            </button>
          </div>

          <div v-if="carregandoAba" class="py-10 text-center text-sm text-muted-foreground">
            Carregando…
          </div>

          <div v-else-if="abaAtiva === 'publicacoes'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PostCard v-for="post in posts" :key="post.id" :post="post" />
            <p v-if="!posts.length" class="col-span-full text-sm text-muted-foreground">
              Nenhuma publicação ainda.
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
