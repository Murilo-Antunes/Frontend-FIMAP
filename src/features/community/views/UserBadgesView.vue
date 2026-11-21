<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Share2 } from 'lucide-vue-next'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import BadgeCard from '../components/BadgeCard.vue'
import { buscarBadgesUsuario, buscarPerfilPorUsername, buscarTodasBadges } from '../services/profile.service'
import type { BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import { percentualNivel, tituloNivel, useNiveis, xpParaProximoNivel } from '../utils/nivel'
import { formatarDataSegura } from '../utils/format-safe'

const route = useRoute()
const router = useRouter()
const { niveis, carregarNiveis } = useNiveis()

const perfil = ref<PerfilUsuario | null>(null)
const badges = ref<BadgeUsuario[]>([])
const totalDisponiveis = ref(0)
const carregando = ref(true)
const erro = ref<string | null>(null)
const filtroAtivo = ref('todas')

const nome = computed(() => perfil.value?.nome_exibicao || perfil.value?.nome || 'Usuário')

const categorias = computed(() => [{ id: 'todas', label: `Todas (${totalDisponiveis.value})` }])

const proximaXp = computed(() =>
  perfil.value ? xpParaProximoNivel(niveis.value, perfil.value.nivel_total ?? 1) : 0,
)

async function carregar(username: string) {
  carregando.value = true
  erro.value = null
  try {
    const [dadosPerfil] = await Promise.all([buscarPerfilPorUsername(username), carregarNiveis()])

    if (!dadosPerfil?.id) {
      erro.value = 'Usuário não encontrado.'
      return
    }

    perfil.value = dadosPerfil

    const [badgesUsuario, todasBadges] = await Promise.all([
      buscarBadgesUsuario(dadosPerfil.id),
      buscarTodasBadges(),
    ])
    badges.value = Array.isArray(badgesUsuario) ? badgesUsuario : []
    totalDisponiveis.value = Array.isArray(todasBadges) ? todasBadges.length : 0
  } catch (e) {
    console.error('Erro ao carregar badges do usuário:', e)
    erro.value = 'Não foi possível carregar essas badges agora. Tente novamente em instantes.'
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

    <div v-if="carregando" class="py-20 text-center text-sm text-muted-foreground">Carregando…</div>

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

    <template v-else-if="perfil">
      <h1 class="text-lg font-semibold text-foreground">Conquistas</h1>
      <p class="text-sm text-muted-foreground">@{{ perfil.username_social ?? '—' }}</p>

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
                Nível {{ perfil.nivel_total ?? '—' }} · {{ tituloNivel(niveis, perfil.nivel_total ?? 1) }}
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
            <span class="font-semibold text-background">{{ perfil.xp_usuario ?? 0 }} XP</span>
          </div>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background/20">
            <div
              class="h-full rounded-full bg-background"
              :style="{ width: `${percentualNivel(perfil.xp_usuario ?? 0, niveis, perfil.nivel_total ?? 1)}%` }"
            />
          </div>
          <p v-if="Number.isFinite(proximaXp)" class="mt-1 text-xs text-background/60">
            Rumo a Nível {{ (perfil.nivel_total ?? 1) + 1 }} · {{ tituloNivel(niveis, (perfil.nivel_total ?? 1) + 1) }}
            ({{ proximaXp }} XP)
          </p>
          <p v-else class="mt-1 text-xs text-background/60">Nível máximo atingido 🎉</p>
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

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BadgeCard
          v-for="badge in badges"
          :key="badge.id"
          :badge="badge"
          :footer-left="`Desbloqueada em ${formatarDataSegura(badge.data_conquista, { month: 'short', year: 'numeric' })}`"
        />
        <p v-if="!badges.length" class="col-span-full text-sm text-muted-foreground">
          Ainda sem badges conquistadas.
        </p>
      </div>
    </template>
  </div>
</template>
