<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AtSign, Award, BadgeCheck, Ban, Check, Contact, FileText, Gavel, Medal, Sparkles, Users } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import {
  atualizarConfiguracoesSociais,
  buscarConfiguracoesSociais,
  buscarIdsBadgesDestaque,
  buscarPerfilPorId,
  buscarResumoSocial,
  desativarPerfilSocial,
} from '../services/profile.service'
import type { ConfiguracoesSociais, PerfilUsuario, QuemPodeComentar, ResumoSocial } from '../types/profile.types'
import { tituloNivel, useNiveis } from '../utils/nivel'

const router = useRouter()
const auth = useAuthStore()
const { niveis, carregarNiveis } = useNiveis()
const idUsuario = computed(() => auth.usuario?.id ?? 0)

const perfil = ref<PerfilUsuario | null>(null)
const config = ref<ConfiguracoesSociais | null>(null)
const resumo = ref<ResumoSocial | null>(null)
const totalDestaques = ref(0)

const carregando = ref(true)
const erro = ref<string | null>(null)
const erroAcao = ref<string | null>(null)
const salvando = ref<string[]>([])

const OPCOES_COMENTARIO: { valor: QuemPodeComentar; label: string }[] = [
  { valor: 'todos', label: 'Todos os Membros Fimap' },
  { valor: 'seguidores', label: 'Apenas meus seguidores' },
  { valor: 'ninguem', label: 'Ninguém' },
]
const menuComentarioAberto = ref(false)
const labelComentario = computed(
  () => OPCOES_COMENTARIO.find((o) => o.valor === config.value?.quem_comenta)?.label ?? OPCOES_COMENTARIO[0].label,
)

const confirmandoDesativar = ref(false)
const desativando = ref(false)

const totalBadges = computed(() => Number(perfil.value?.total_badges ?? 0))
const audienciaFormatada = computed(() => {
  const n = resumo.value?.audiencia_visivel
  if (n === null || n === undefined) return null
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
})

async function carregar() {
  if (!idUsuario.value) return
  carregando.value = true
  erro.value = null
  try {
    const [dadosPerfil, configuracoes] = await Promise.all([
      buscarPerfilPorId(idUsuario.value),
      buscarConfiguracoesSociais(idUsuario.value),
      carregarNiveis(),
    ])

    if (!dadosPerfil?.id) {
      erro.value = 'Não foi possível carregar suas configurações agora.'
      return
    }

    perfil.value = dadosPerfil
    config.value = configuracoes

    // Blocos secundários: se falharem, a tela continua funcionando sem eles.
    const [resumoSocial, destaques] = await Promise.allSettled([
      buscarResumoSocial(idUsuario.value),
      buscarIdsBadgesDestaque(idUsuario.value),
    ])
    resumo.value = resumoSocial.status === 'fulfilled' ? resumoSocial.value : null
    totalDestaques.value = destaques.status === 'fulfilled' ? destaques.value.length : 0
  } catch (e) {
    console.error('Erro ao carregar configurações sociais:', e)
    erro.value = 'Não foi possível carregar suas configurações agora. Tente novamente em instantes.'
  } finally {
    carregando.value = false
  }
}

/** Atualização otimista: aplica na hora e volta atrás se a API falhar. */
async function alterar<K extends keyof ConfiguracoesSociais>(campo: K, valor: ConfiguracoesSociais[K]) {
  if (!config.value || salvando.value.includes(campo)) return
  const anterior = config.value[campo]
  erroAcao.value = null
  salvando.value = [...salvando.value, campo]
  config.value = { ...config.value, [campo]: valor }

  try {
    await atualizarConfiguracoesSociais(idUsuario.value, { [campo]: valor })
  } catch (e) {
    console.error(`Erro ao salvar "${campo}":`, e)
    config.value = { ...config.value, [campo]: anterior }
    erroAcao.value = 'Não foi possível salvar essa alteração. Tente novamente.'
  } finally {
    salvando.value = salvando.value.filter((c) => c !== campo)
  }
}

function escolherQuemComenta(valor: QuemPodeComentar) {
  menuComentarioAberto.value = false
  if (valor !== config.value?.quem_comenta) alterar('quem_comenta', valor)
}

async function confirmarDesativacao() {
  if (desativando.value) return
  desativando.value = true
  erroAcao.value = null
  try {
    await desativarPerfilSocial(idUsuario.value)
    confirmandoDesativar.value = false
    router.replace({ name: 'dashboard' })
  } catch (e) {
    console.error('Erro ao desativar perfil social:', e)
    confirmandoDesativar.value = false
    erroAcao.value = 'Não foi possível desativar o perfil agora. Tente novamente.'
  } finally {
    desativando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-[60px]">
    <div v-if="carregando" class="py-20 text-center text-sm text-neutral-500">Carregando…</div>

    <div v-else-if="erro" class="flex flex-col items-center gap-3 py-20 text-center">
      <p class="text-sm text-neutral-500">{{ erro }}</p>
      <button
        type="button"
        class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
        @click="carregar"
      >
        Tentar novamente
      </button>
    </div>

    <template v-else-if="perfil && config">
      <header>
        <div class="flex items-center gap-2.5">
          <span class="flex size-7 items-center justify-center rounded-full bg-black text-white" aria-hidden="true">
            <Users :size="14" />
          </span>
          <h1 class="text-xl font-semibold text-neutral-900">Espaço Social Fimap</h1>
        </div>
        <p class="mt-1 max-w-sm text-sm leading-relaxed text-neutral-500">
          Privacidade, notificações e governança das suas interações com outros investidores.
        </p>
      </header>

      <p v-if="erroAcao" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ erroAcao }}
      </p>

      <!-- Resumo -->
      <section class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:max-w-[1192px]">
        <div class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <UserAvatar :src="perfil.foto_perfil" :name="perfil.nome_exibicao || perfil.nome" size="lg" />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-neutral-900">@{{ perfil.username_social ?? '—' }}</p>
            <p class="text-xs font-medium text-indigo-600">
              Nível {{ perfil.nivel_total ?? '—' }} • {{ tituloNivel(niveis, perfil.nivel_total ?? 1) }}
            </p>
            <p v-if="!config.visibilidade" class="text-xs text-neutral-500">Perfil privado</p>
            <p v-else-if="audienciaFormatada" class="text-xs text-neutral-500">
              Visível para {{ audienciaFormatada }} investidores
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
            <BadgeCheck :size="22" aria-hidden="true" />
          </span>
          <div>
            <p class="text-sm font-medium text-neutral-900">
              {{ totalBadges }} {{ totalBadges === 1 ? 'Badge Conquistada' : 'Badges Conquistadas' }}
            </p>
            <p class="text-xs text-neutral-500">{{ totalDestaques }} em exibição no feed</p>
            <p v-if="resumo?.xp_semana != null" class="text-xs text-neutral-500">
              +{{ resumo.xp_semana }} XP esta semana
            </p>
          </div>
        </div>
      </section>

      <!-- Identidade & reputação -->
      <section class="mt-8">
        <h2 class="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Identidade &amp; Reputação
        </h2>
        <ul class="overflow-hidden rounded-2xl bg-white shadow-sm">
          <li>
            <!-- ⚠️ ajuste o nome da rota pra tela de edição que você já criou. -->
            <RouterLink
              :to="{ name: 'community-profile-edit' }"
              class="flex items-center gap-3 px-4 py-4 transition hover:bg-neutral-50"
            >
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                <Contact :size="18" aria-hidden="true" />
              </span>
              <span>
                <span class="block text-sm font-medium text-neutral-900">Personalizar Perfil Público</span>
                <span class="block text-xs text-neutral-500">Editar foto, biografia, username e links sociais</span>
              </span>
            </RouterLink>
          </li>
          <li><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li>
            <RouterLink
              :to="{ name: 'community-profile-badges' }"
              class="flex items-center gap-3 px-4 py-4 transition hover:bg-neutral-50"
            >
              <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-indigo-600">
                <Medal :size="18" aria-hidden="true" />
              </span>
              <span>
                <span class="flex items-center gap-2 text-sm font-medium text-neutral-900">
                  Minhas Badges e Conquistas
                  <span
                    v-if="resumo?.percentil_ranking != null"
                    class="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600"
                  >
                    Top {{ resumo.percentil_ranking }}%
                  </span>
                </span>
                <span class="block text-xs text-neutral-500">Gerenciar badges em exibição e histórico de níveis</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Privacidade & visibilidade -->
      <section class="mt-8">
        <h2 class="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Privacidade &amp; Visibilidade
        </h2>
        <div class="rounded-2xl bg-white shadow-sm" @keydown.esc="menuComentarioAberto = false">
          <div class="flex items-center justify-between gap-4 px-4 py-4">
            <div>
              <p class="text-sm font-medium text-neutral-900">Perfil Público na Comunidade</p>
              <p class="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                Permite que outros membros vejam seus posts técnicos e insígnias ativas.
              </p>
            </div>
            <ToggleSwitch
              :model-value="config.visibilidade"
              label="Perfil público na comunidade"
              :disabled="salvando.includes('visibilidade')"
              @update:model-value="alterar('visibilidade', $event)"
            />
          </div>

          <div class="mx-4 h-[3px] rounded-full bg-neutral-100" role="separator" />

          <div class="relative px-4 py-4">
            <p class="text-sm font-medium text-neutral-900">Quem pode comentar em seus posts</p>
            <button
              type="button"
              class="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600"
              aria-haspopup="listbox"
              :aria-expanded="menuComentarioAberto"
              :disabled="salvando.includes('quem_comenta')"
              @click="menuComentarioAberto = !menuComentarioAberto"
            >
              <span class="size-1.5 rounded-full bg-indigo-600" aria-hidden="true" />
              {{ labelComentario }}
            </button>

            <template v-if="menuComentarioAberto">
              <button
                type="button"
                class="fixed inset-0 z-10 cursor-default"
                tabindex="-1"
                aria-label="Fechar opções"
                @click="menuComentarioAberto = false"
              />
              <ul role="listbox" class="absolute left-4 top-full z-20 mt-1 w-64 rounded-xl bg-white p-1 shadow-lg">
                <li
                  v-for="opcao in OPCOES_COMENTARIO"
                  :key="opcao.valor"
                  role="option"
                  :aria-selected="opcao.valor === config.quem_comenta"
                >
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100"
                    @click="escolherQuemComenta(opcao.valor)"
                  >
                    {{ opcao.label }}
                    <Check v-if="opcao.valor === config.quem_comenta" :size="14" aria-hidden="true" />
                  </button>
                </li>
              </ul>
            </template>
          </div>
        </div>
      </section>

      <!-- Notificações sociais -->
      <section class="mt-8">
        <h2 class="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Notificações Sociais
        </h2>
        <ul class="rounded-2xl bg-white shadow-sm">
          <li class="flex items-center justify-between gap-4 px-4 py-4">
            <div class="flex items-center gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                <AtSign :size="17" aria-hidden="true" />
              </span>
              <div>
                <p class="text-sm font-medium text-neutral-900">Respostas e Menções</p>
                <p class="text-xs text-neutral-500">Avisar quando você for citado em um debate</p>
              </div>
            </div>
            <ToggleSwitch
              :model-value="config.notif_respostas_mencoes"
              label="Notificar respostas e menções"
              :disabled="salvando.includes('notif_respostas_mencoes')"
              @update:model-value="alterar('notif_respostas_mencoes', $event)"
            />
          </li>
          <li><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li class="flex items-center justify-between gap-4 px-4 py-4">
            <div class="flex items-center gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                <Sparkles :size="17" aria-hidden="true" />
              </span>
              <div>
                <p class="text-sm font-medium text-neutral-900">Novos Tópicos e Destaques da IA</p>
                <p class="text-xs text-neutral-500">Resumos curados com base na sua carteira</p>
              </div>
            </div>
            <ToggleSwitch
              :model-value="config.notif_topicos_ia"
              label="Notificar novos tópicos e destaques da IA"
              :disabled="salvando.includes('notif_topicos_ia')"
              @update:model-value="alterar('notif_topicos_ia', $event)"
            />
          </li>
          <li><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li class="flex items-center justify-between gap-4 px-4 py-4">
            <div class="flex items-center gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                <Award :size="17" aria-hidden="true" />
              </span>
              <div>
                <p class="text-sm font-medium text-neutral-900">Conquistas &amp; Novas Badges</p>
                <p class="text-xs text-neutral-500">Notificar desbloqueios de níveis e metas financeiras</p>
              </div>
            </div>
            <ToggleSwitch
              :model-value="config.notif_conquistas"
              label="Notificar conquistas e novas badges"
              :disabled="salvando.includes('notif_conquistas')"
              @update:model-value="alterar('notif_conquistas', $event)"
            />
          </li>
        </ul>
      </section>

      <!-- Segurança & moderação -->
      <section class="mt-8">
        <div class="mb-2 flex items-center justify-between px-1">
          <h2 class="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Segurança &amp; Moderação
          </h2>
          <span class="text-xs text-neutral-500">Compliance Fimap</span>
        </div>
        <!-- ⚠️ Estas três telas ainda não existem (usuários bloqueados, diretrizes, termos),
             então as linhas ainda não navegam pra lugar nenhum. -->
        <ul class="overflow-hidden rounded-2xl bg-white shadow-sm">
          <li>
            <button type="button" class="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-neutral-50">
              <Ban :size="18" class="shrink-0 text-neutral-900" aria-hidden="true" />
              <span class="text-sm font-medium text-neutral-900">Usuários Bloqueados</span>
            </button>
          </li>
          <li><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li>
            <button type="button" class="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-neutral-50">
              <Gavel :size="18" class="shrink-0 text-neutral-900" aria-hidden="true" />
              <span>
                <span class="block text-sm font-medium text-neutral-900">Diretrizes da Comunidade Fimap</span>
                <span class="block text-xs text-neutral-500">
                  Respeito mútuo, sigilo estrito de senhas e dados confidenciais
                </span>
              </span>
            </button>
          </li>
          <li><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li>
            <button type="button" class="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-neutral-50">
              <FileText :size="18" class="shrink-0 text-neutral-900" aria-hidden="true" />
              <span class="text-sm font-medium text-neutral-900">Termos de Uso Social</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- Desativar -->
      <section class="mt-14 pb-10">
        <button
          type="button"
          class="w-full rounded-xl bg-red-100 py-3 text-sm font-medium text-red-700 transition hover:bg-red-200"
          @click="confirmandoDesativar = true"
        >
          Desativar Perfil da Comunidade
        </button>
        <p class="mx-auto mt-4 max-w-xs text-center text-xs leading-relaxed text-neutral-500">
          Isso removerá seus posts, badges e menções públicas do feed, mantendo seus dados bancários e conta Fimap
          intactos.
        </p>
      </section>
    </template>

    <!-- Confirmação (ação destrutiva) -->
    <div
      v-if="confirmandoDesativar"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-desativar"
      @click.self="confirmandoDesativar = false"
      @keydown.esc="confirmandoDesativar = false"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="titulo-desativar" class="text-base font-semibold text-neutral-900">
          Desativar perfil da comunidade?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-neutral-500">
          Seus posts, badges e menções públicas deixarão de aparecer no feed. Seus dados bancários e sua conta Fimap
          não são afetados.
        </p>
        <div class="mt-5 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-xl bg-neutral-100 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
            @click="confirmandoDesativar = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="desativando"
            class="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            @click="confirmarDesativacao"
          >
            {{ desativando ? 'Desativando…' : 'Desativar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
