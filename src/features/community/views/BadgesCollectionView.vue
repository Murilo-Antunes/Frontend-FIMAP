<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Sparkles } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import BadgeCard from '../components/BadgeCard.vue'
import { buscarBadgesUsuario, buscarPerfilPorId, buscarProgressoBadges, buscarTodasBadges } from '../services/profile.service'
import type { Badge, BadgeEmProgresso, BadgeUsuario, PerfilUsuario } from '../types/profile.types'
import { percentualNivel, tituloNivel, useNiveis, xpParaProximoNivel } from '../utils/nivel'
import { formatarDataSegura } from '../utils/format-safe'

const router = useRouter()
const auth = useAuthStore()
const { niveis, carregarNiveis } = useNiveis()

const perfil = ref<PerfilUsuario | null>(null)
const conquistadas = ref<BadgeUsuario[]>([])
const emProgresso = ref<BadgeEmProgresso[]>([])
const todasBadges = ref<Badge[]>([])
const totalDisponiveis = ref(0)
const carregando = ref(true)
const erro = ref<string | null>(null)
const filtroAtivo = ref('todas')

// ⚠️ tbl_badge já tem id_categoria, mas ainda não existe endpoint pra listar
// os nomes das categorias — por isso o filtro continua só com "Todas".
const categorias = computed(() => [
  { id: 'todas', label: `Todas (${totalDisponiveis.value})` },
])

const percentualBadges = computed(() =>
  totalDisponiveis.value ? Math.round((conquistadas.value.length / totalDisponiveis.value) * 100) : 0,
)

const proximaXp = computed(() =>
  perfil.value ? xpParaProximoNivel(niveis.value, perfil.value.nivel_total ?? 1) : 0,
)

// Inclui também badges sem critério de progresso publicado pela API.
const bloqueadas = computed(() => {
  const idsConquistadas = new Set(conquistadas.value.map((badge) => badge.id))
  const progressoPorId = new Map(emProgresso.value.map((badge) => [badge.id, badge]))
  return todasBadges.value
    .filter((badge) => !idsConquistadas.has(badge.id))
    .map((badge) => ({ badge, progresso: progressoPorId.get(badge.id) }))
})

async function carregar() {
  if (!auth.usuario?.id) return
  carregando.value = true
  erro.value = null
  try {
    const [dadosPerfil, badgesUsuario, badgesDisponiveis, progresso] = await Promise.all([
      buscarPerfilPorId(auth.usuario.id),
      buscarBadgesUsuario(auth.usuario.id),
      buscarTodasBadges(),
      buscarProgressoBadges(auth.usuario.id),
      carregarNiveis(),
    ])
    perfil.value = dadosPerfil
    conquistadas.value = Array.isArray(badgesUsuario) ? badgesUsuario : []
    todasBadges.value = Array.isArray(badgesDisponiveis) ? badgesDisponiveis : []
    totalDisponiveis.value = todasBadges.value.length
    emProgresso.value = Array.isArray(progresso) ? progresso : []
  } catch (e) {
    console.error('Erro ao carregar coleção de badges:', e)
    erro.value = 'Não foi possível carregar suas badges agora. Tente novamente em instantes.'
  } finally {
    carregando.value = false
  }
}

function progressoPercentual(badge: BadgeEmProgresso): number {
  if (!badge.progresso_total) return 0
  return Math.max(0, Math.min(100, Math.round((badge.progresso_atual / badge.progresso_total) * 100)))
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
    <button
      type="button"
      class="mb-4 rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100"
      @click="router.back()"
    >
      <ArrowLeft :size="18" />
    </button>

    <div v-if="carregando" class="py-20 text-center text-sm text-neutral-500">Carregando…</div>

    <div v-else-if="erro" class="flex flex-col items-center gap-3 py-20 text-center">
      <p class="text-sm text-neutral-500">{{ erro }}</p>
      <button type="button" class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200" @click="carregar">
        Tentar novamente
      </button>
    </div>

    <template v-else-if="perfil">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <!-- Card preto literal (bg-black), igual ao resto do app — não um token de tema. -->
        <div class="flex flex-col justify-between rounded-2xl bg-black p-6 text-white">
          <div class="flex items-start justify-between">
            <div>
              <span class="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                Nível {{ perfil.nivel_total ?? '—' }}
              </span>
              <h1 class="mt-2 text-xl font-semibold">{{ tituloNivel(niveis, perfil.nivel_total ?? 1) }}</h1>
            </div>
            <div class="text-right text-xs text-white/70">
              PROGRESSO<br />BADGES
              <p class="text-lg font-semibold text-white">{{ percentualBadges }}%</p>
            </div>
          </div>

          <div class="mt-6">
            <div class="flex justify-between text-xs text-white/70">
              <span>{{ perfil.xp_usuario ?? 0 }} XP</span>
              <span v-if="Number.isFinite(proximaXp)">{{ proximaXp }} XP</span>
              <span v-else>Nível máximo</span>
            </div>
            <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                class="h-full rounded-full bg-white"
                :style="{ width: `${percentualNivel(perfil.xp_usuario ?? 0, niveis, perfil.nivel_total ?? 1)}%` }"
              />
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm">
            <span>{{ conquistadas.length }} de {{ totalDisponiveis }} Badges Desbloqueadas</span>
            <span class="font-semibold">Rank #{{ perfil.ranking_posicao ?? '—' }}</span>
          </div>
        </div>

        <!-- Sem ring/border — só sombra. -->
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <p class="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Sparkles :size="16" /> Dica do Mentor IA
          </p>
          <!-- ⚠️ Conteúdo estático — ainda sem endpoint de "dica" ligada a badges. -->
          <p class="mt-2 text-sm leading-relaxed text-neutral-500">
            Continue completando metas e simulações para desbloquear novas badges e ganhar XP.
          </p>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <h2 class="text-base font-semibold text-neutral-900">Coleção de Conquistas</h2>
      </div>

      <div class="mt-3 flex gap-2 overflow-x-auto">
        <button
          v-for="cat in categorias"
          :key="cat.id"
          type="button"
          class="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition"
          :class="filtroAtivo === cat.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'"
          @click="filtroAtivo = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BadgeCard
          v-for="badge in conquistadas"
          :key="`c-${badge.id}`"
          :badge="badge"
          checked
          :footer-left="`Desbloqueada em ${formatarDataSegura(badge.data_conquista, { month: 'short', year: 'numeric' })}`"
        />
        <BadgeCard
          v-for="item in bloqueadas"
          :key="`p-${item.badge.id}`"
          :badge="item.badge"
          locked
          :tag="item.progresso ? 'Em curso' : 'Bloqueada'"
          :progress="item.progresso ? progressoPercentual(item.progresso) : undefined"
          :footer-left="item.progresso
            ? `Faltam ${Math.max(0, item.progresso.progresso_total - item.progresso.progresso_atual)}`
            : 'Progresso indisponível'"
          :footer-right="item.progresso ? `de ${item.progresso.progresso_total}` : undefined"
        />
        <p v-if="!conquistadas.length && !bloqueadas.length" class="col-span-full text-sm text-neutral-500">
          Nenhuma badge para mostrar ainda.
        </p>
      </div>
    </template>
  </div>
</template>
