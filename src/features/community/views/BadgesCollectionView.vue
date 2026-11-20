<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Sparkles } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import BadgeCard from '../components/BadgeCard.vue'
import { buscarBadgesUsuario, buscarPerfilPorId, buscarTodasBadges } from '../services/profile.service'
import type { BadgeEmProgresso, BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import { percentualNivel, tituloNivel, xpParaProximoNivel } from '../utils/nivel'

const router = useRouter()
const auth = useAuthStore()

const perfil = ref<PerfilUsuario | null>(null)
const conquistadas = ref<BadgeUsuario[]>([])
const totalDisponiveis = ref(0)
const carregando = ref(true)
const filtroAtivo = ref('todas')

// ⚠️ Sem suporte no backend hoje: tbl_badge_usuario só registra o que já foi
// conquistado, não existe cálculo de progresso para badges bloqueadas. Deixo
// a estrutura pronta (vazia) para quando essa informação existir.
const emProgresso = ref<BadgeEmProgresso[]>([])

// ⚠️ Sem coluna "categoria" em tbl_badge: os filtros abaixo mostram contagens,
// mas não conseguem de fato segmentar as badges por tema ainda.
const categorias = computed(() => [
  { id: 'todas', label: `Todas (${totalDisponiveis.value})` },
])

const percentualBadges = computed(() =>
  totalDisponiveis.value ? Math.round((conquistadas.value.length / totalDisponiveis.value) * 100) : 0,
)

async function carregar() {
  if (!auth.usuario?.id) return
  carregando.value = true
  try {
    const [dadosPerfil, badgesUsuario, todasBadges] = await Promise.all([
      buscarPerfilPorId(auth.usuario.id),
      buscarBadgesUsuario(auth.usuario.id),
      buscarTodasBadges(),
    ])
    perfil.value = dadosPerfil
    conquistadas.value = badgesUsuario
    totalDisponiveis.value = todasBadges.length
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
    <button
      type="button"
      class="mb-4 flex items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground transition hover:bg-neutral-100"
      @click="router.back()"
    >
      <ArrowLeft :size="18" />
    </button>

    <div v-if="carregando" class="py-20 text-center text-sm text-muted-foreground">Carregando…</div>

    <template v-else-if="perfil">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div class="flex flex-col justify-between rounded-2xl bg-foreground p-6 text-background">
          <div class="flex items-start justify-between">
            <div>
              <span class="rounded-full bg-background/15 px-2.5 py-1 text-[11px] font-semibold">
                Nível {{ perfil.nivel_total }}
              </span>
              <h1 class="mt-2 text-xl font-semibold">{{ tituloNivel(perfil.nivel_total) }}</h1>
            </div>
            <div class="text-right text-xs text-background/70">
              PROGRESSO<br />BADGES
              <p class="text-lg font-semibold text-background">{{ percentualBadges }}%</p>
            </div>
          </div>

          <div class="mt-6">
            <div class="flex justify-between text-xs text-background/70">
              <span>{{ perfil.xp_usuario }} XP</span>
              <span>{{ xpParaProximoNivel(perfil.nivel_total) }} XP</span>
            </div>
            <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-background/20">
              <div
                class="h-full rounded-full bg-background"
                :style="{ width: `${percentualNivel(perfil.xp_usuario, perfil.nivel_total)}%` }"
              />
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between rounded-xl bg-background/10 px-4 py-3 text-sm">
            <span>{{ conquistadas.length }} de {{ totalDisponiveis }} Badges Desbloqueadas</span>
            <span class="font-semibold">Rank #{{ perfil.ranking_posicao }}</span>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-5 ring-1 ring-border/50">
          <p class="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles :size="16" /> Dica do Mentor IA
          </p>
          <!-- ⚠️ Conteúdo estático por enquanto: não há endpoint de "dica" ligada a badges
               (tbl_recomendacao_ia é sobre recomendações financeiras, não sobre badges). -->
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Continue completando metas e simulações para desbloquear novas badges e ganhar XP.
          </p>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <h2 class="text-base font-semibold text-foreground">Coleção de Conquistas</h2>
      </div>

      <div class="mt-3 flex gap-2 overflow-x-auto">
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

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BadgeCard
          v-for="badge in conquistadas"
          :key="badge.id"
          :badge="badge"
          checked
          :footer-left="`Desbloqueada em ${new Date(badge.data_conquista).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`"
        />
        <BadgeCard
          v-for="badge in emProgresso"
          :key="`em-progresso-${badge.id}`"
          :badge="badge"
          locked
          tag="Em curso"
          :progress="Math.round((badge.progresso_atual / badge.progresso_total) * 100)"
        />
      </div>
    </template>
  </div>
</template>
