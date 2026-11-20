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
  buscarPerfilPorId,
  buscarTodasBadges,
  listarComentariosPorUsuario,
  listarPostsInativos,
  listarPostsPorUsuario,
} from '../services/profile.service'
import type { AbaPerfil, Badge, BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import type { Post } from '@/features/community/types/community.types'

const router = useRouter()
const auth = useAuthStore()
const idUsuario = computed(() => auth.usuario?.id ?? 0)

const perfil = ref<PerfilUsuario | null>(null)
const minhasBadges = ref<BadgeUsuario[]>([])
const totalBadgesDisponiveis = ref(0)
const carregandoPerfil = ref(true)

const abaAtiva = ref<AbaPerfil>('publicacoes')
const posts = ref<Post[]>([])
const arquivados = ref<Post[]>([])
const respostas = ref<Awaited<ReturnType<typeof listarComentariosPorUsuario>>['comentarios']>([])
const totalRespostas = ref(0)
const carregandoAba = ref(false)

// Badges em destaque: usa as marcadas com em_destaque; se nada vier marcado
// (⚠️ ver TODO no service sobre esse campo), cai nas 3 mais recentes como fallback.
const badgesDestaque = computed<BadgeUsuario[]>(() => {
  const marcadas = minhasBadges.value.filter((b) => b.em_destaque)
  return (marcadas.length ? marcadas : minhasBadges.value).slice(0, 3)
})

const postsMaisRespostas = computed(() => posts.value.length + totalRespostas.value)

async function carregarPerfil() {
  if (!idUsuario.value) return
  carregandoPerfil.value = true
  try {
    const [dadosPerfil, badgesUsuario, todasBadges] = await Promise.all([
      buscarPerfilPorId(idUsuario.value),
      buscarBadgesUsuario(idUsuario.value),
      buscarTodasBadges(),
    ])
    perfil.value = dadosPerfil
    minhasBadges.value = badgesUsuario
    totalBadgesDisponiveis.value = todasBadges.length
  } finally {
    carregandoPerfil.value = false
  }
}

async function carregarAba(aba: AbaPerfil) {
  if (!idUsuario.value) return
  carregandoAba.value = true
  try {
    if (aba === 'publicacoes') {
      posts.value = await listarPostsPorUsuario(idUsuario.value)
    } else if (aba === 'respostas') {
      const resultado = await listarComentariosPorUsuario(idUsuario.value)
      respostas.value = resultado.comentarios
      totalRespostas.value = resultado.quantidade
    } else if (aba === 'arquivados') {
      arquivados.value = await listarPostsInativos(idUsuario.value)
    }
    // 'salvos': sem rota no backend ainda — ver aviso na própria aba.
  } finally {
    carregandoAba.value = false
  }
}

function selecionarAba(aba: AbaPerfil) {
  abaAtiva.value = aba
  if (aba !== 'salvos') carregarAba(aba)
}

function abrirEdicao() {
  // ⚠️ ajuste o nome da rota conforme a tela de edição que você já criou.
  router.push({ name: 'community-profile-edit' })
}

onMounted(async () => {
  await carregarPerfil()
  await carregarAba('publicacoes')
})
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

      <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold tracking-wide text-neutral-600">
        COMUNIDADE FIMAP
      </span>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
          aria-label="Compartilhar perfil"
        >
          <Share2 :size="18" />
        </button>
        <!-- ⚠️ Ainda sem tela de destino — você disse que vai mandar a referência. -->
        <button
          type="button"
          class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
          aria-label="Configurações do perfil"
        >
          <Settings :size="18" />
        </button>
      </div>
    </div>

    <div v-if="carregandoPerfil" class="py-20 text-center text-sm text-muted-foreground">
      Carregando perfil…
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
            <h2 class="text-base font-semibold text-foreground">Badges em Destaque</h2>
            <RouterLink
              :to="{ name: 'community-profile-badges' }"
              class="text-sm font-medium text-muted-foreground hover:text-foreground"
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
          <p v-else class="text-sm text-muted-foreground">
            Você ainda não conquistou nenhuma badge.
          </p>
        </section>

        <section>
          <div class="flex gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 text-sm">
            <button
              v-for="aba in (['publicacoes', 'respostas', 'salvos', 'arquivados'] as AbaPerfil[])"
              :key="aba"
              type="button"
              class="whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition"
              :class="abaAtiva === aba ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'"
              @click="selecionarAba(aba)"
            >
              <template v-if="aba === 'publicacoes'">Publicações ({{ posts.length }})</template>
              <template v-else-if="aba === 'respostas'">Respostas ({{ totalRespostas }})</template>
              <template v-else-if="aba === 'salvos'">Salvos</template>
              <template v-else>Arquivados ({{ arquivados.length }})</template>
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

          <div v-else-if="abaAtiva === 'respostas'" class="mt-4 flex flex-col gap-3">
            <p
              v-for="resposta in respostas"
              :key="resposta.id"
              class="rounded-2xl bg-white p-4 text-sm text-foreground/90 ring-1 ring-border/50"
            >
              {{ resposta.mensagem }}
            </p>
            <p v-if="!respostas.length" class="text-sm text-muted-foreground">
              Nenhuma resposta ainda.
            </p>
          </div>

          <div v-else-if="abaAtiva === 'salvos'" class="mt-4 rounded-2xl bg-neutral-50 p-6 text-center text-sm text-muted-foreground">
            ⚠️ A funcionalidade de salvar publicações ainda não existe no backend
            (precisa de uma tabela/rota equivalente a "tbl_post_salvo").
          </div>

          <div v-else class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PostCard v-for="post in arquivados" :key="post.id" :post="post" />
            <p v-if="!arquivados.length" class="col-span-full text-sm text-muted-foreground">
              Nenhuma publicação arquivada.
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
