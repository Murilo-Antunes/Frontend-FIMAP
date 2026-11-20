<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Share2 } from 'lucide-vue-next'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import BadgeCard from '../components/BadgeCard.vue'
import { buscarBadgesUsuario, buscarPerfilPorUsername, buscarTodasBadges } from '../services/profile.service'
import type { BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import { percentualNivel, tituloNivel, xpParaProximoNivel } from '../utils/nivel'

const route = useRoute()
const router = useRouter()

const perfil = ref<PerfilUsuario | null>(null)
const badges = ref<BadgeUsuario[]>([])
const totalDisponiveis = ref(0)
const carregando = ref(true)
const filtroAtivo = ref('todas')

const nome = computed(() => perfil.value?.nome_exibicao || perfil.value?.nome || '')

// ⚠️ Mesma ressalva da tela de coleção própria: sem coluna "categoria" em
// tbl_badge não dá pra segmentar de verdade — os chips abaixo são só visuais.
const categorias = computed(() => [{ id: 'todas', label: `Todas (${totalDisponiveis.value})` }])

async function carregar(username: string) {
  carregando.value = true
  try {
    const dadosPerfil = await buscarPerfilPorUsername(username)
    perfil.value = dadosPerfil

    const [badgesUsuario, todasBadges] = await Promise.all([
      buscarBadgesUsuario(dadosPerfil.id),
      buscarTodasBadges(),
    ])
    badges.value = badgesUsuario
    totalDisponiveis.value = todasBadges.length
  } finally {
    carregando.value = false
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
      <button type="button" class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100" aria-label="Compartilhar">
        <Share2 :size="18" />
      </button>
    </div>

    <h1 class="text-lg font-semibold text-foreground">Conquistas</h1>
    <p class="text-sm text-muted-foreground">@{{ perfil?.username_social }}</p>

    <div v-if="carregando" class="py-20 text-center text-sm text-muted-foreground">Carregando…</div>

    <template v-else-if="perfil">
      <div class="mt-4 rounded-2xl bg-foreground p-6 text-background">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UserAvatar :src="perfil.foto_perfil" :name="nome" size="lg" />
            <div>
              <p class="flex items-center gap-2 font-semibold">
                {{ nome }}
                <span v-if="perfil.plano === 'PRO'" class="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                  PRO
                </span>
              </p>
              <p class="text-sm text-background/70">
                Nível {{ perfil.nivel_total }} · {{ tituloNivel(perfil.nivel_total) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold leading-none">
              {{ badges.length }}<span class="text-base text-background/60">/{{ totalDisponiveis }}</span>
            </p>
            <p class="text-xs text-background/60">Badges Ativas</p>
          </div>
        </div>

        <div class="mt-5 rounded-xl bg-background/10 p-4">
          <div class="flex items-center justify-between text-xs text-background/70">
            <span>🚩 REPUTAÇÃO COMUNITÁRIA</span>
            <span class="font-semibold text-background">{{ perfil.xp_usuario }} XP</span>
          </div>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/20">
            <div
              class="h-full rounded-full bg-background"
              :style="{ width: `${percentualNivel(perfil.xp_usuario, perfil.nivel_total)}%` }"
            />
          </div>
          <p class="mt-1 text-xs text-background/60">
            Rumo a Nível {{ perfil.nivel_total + 1 }} · {{ tituloNivel(perfil.nivel_total + 1) }}
            ({{ xpParaProximoNivel(perfil.nivel_total) }} XP)
          </p>
        </div>
      </div>

      <div class="mt-5 flex gap-2 overflow-x-auto">
        <button
          v-for="cat in categorias"
          :key="cat.id"
          type="button"
          class="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition"
          :class="filtroAtivo === cat.id ? 'bg-foreground text-background' : 'bg-neutral-100 text-muted-foreground'"
          @click="filtroAtivo = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Só badges conquistadas: para outro usuário não faz sentido mostrar
           progresso de badges bloqueadas (nem o backend calcula isso hoje). -->
      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BadgeCard
          v-for="badge in badges"
          :key="badge.id"
          :badge="badge"
          :footer-left="`Desbloqueada em ${new Date(badge.data_conquista).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`"
        />
        <p v-if="!badges.length" class="col-span-full text-sm text-muted-foreground">
          Ainda sem badges conquistadas.
        </p>
      </div>
    </template>
  </div>
</template>
