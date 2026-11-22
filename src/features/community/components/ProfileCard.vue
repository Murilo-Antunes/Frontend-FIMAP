<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Calendar, MapPin, UserPlus, UserCheck } from 'lucide-vue-next'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import type { PerfilUsuario } from '../types/profile.types'
import { tituloNivel, useNiveis } from '../utils/nivel'
import { formatarDataSegura, numeroSeguro } from '../utils/format-safe'

const props = defineProps<{
  perfil: PerfilUsuario
  /** 'own' mostra "Personalizar Perfil"; 'public' mostra Seguir/Seguindo. */
  mode: 'own' | 'public'
  seguindo?: boolean
  seguindoBusy?: boolean
}>()

const emit = defineEmits<{
  editar: []
  seguir: []
}>()

const { niveis, carregarNiveis } = useNiveis()
onMounted(carregarNiveis)

const nome = computed(() => props.perfil.nome_exibicao || props.perfil.nome || 'Usuário')
const handle = computed(() => (props.perfil.username_social ? `@${props.perfil.username_social}` : ''))
const membroDesde = computed(() => formatarDataSegura(props.perfil.data_cadastro))
const tituloNivelAtual = computed(() => tituloNivel(niveis.value, props.perfil.nivel_total ?? 1))

const postsMaisRespostas = computed(
  () => (props.perfil as any).total_posts_respostas ?? undefined,
)

const totalSeguidores = computed(() => numeroSeguro(props.perfil.total_seguidores))
const totalSeguindo = computed(() => numeroSeguro(props.perfil.total_seguindo))
</script>

<template>
  <!-- Sem borda/ring — só sombra. -->
  <aside class="flex h-fit flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
    <div class="flex items-start justify-between">
      <UserAvatar :src="perfil.foto_perfil" :name="nome" size="lg" />
      <span
        v-if="mode === 'public'"
        class="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700"
      >
        🏆 Nível {{ perfil.nivel_total ?? '—' }} · {{ tituloNivelAtual }}
      </span>
    </div>

    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold text-neutral-900">{{ nome }}</h1>
        <span
          v-if="perfil.plano === 'PRO'"
          class="rounded-md bg-black px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          PRO
        </span>
      </div>
      <p v-if="handle" class="text-sm text-neutral-500">{{ handle }}</p>

      <!-- Duas linhas com ícone, como na referência (não é uma lista separada por ponto). -->
      <div class="mt-2 flex flex-col gap-1 text-xs text-neutral-500">
        <span class="flex items-center gap-1.5">
          <Calendar :size="13" aria-hidden="true" /> Membro desde {{ membroDesde }}
        </span>
        <span v-if="perfil.localizacao_estado" class="flex items-center gap-1.5">
          <MapPin :size="13" aria-hidden="true" /> {{ perfil.localizacao_estado }}
        </span>
      </div>
    </div>

    <p v-if="perfil.biografia_social" class="whitespace-pre-line text-sm leading-relaxed text-neutral-800">
      {{ perfil.biografia_social }}
    </p>

    <!-- Sem linha divisória — só espaçamento, igual à referência. -->
    <div class="flex items-center gap-6 text-center">
      <div>
        <p class="text-base font-semibold tabular-nums text-neutral-900">
          {{ postsMaisRespostas ?? '—' }}
        </p>
        <p class="text-xs text-neutral-500">Posts &amp; Resp.</p>
      </div>
      <div>
        <p class="text-base font-semibold tabular-nums text-neutral-900">{{ totalSeguidores }}</p>
        <p class="text-xs text-neutral-500">Seguidores</p>
      </div>
      <div>
        <p class="text-base font-semibold tabular-nums text-neutral-900">{{ totalSeguindo }}</p>
        <p class="text-xs text-neutral-500">Seguindo</p>
      </div>
    </div>

    <button
      v-if="mode === 'own'"
      type="button"
      class="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      @click="emit('editar')"
    >
      Personalizar Perfil
    </button>

    <button
      v-else
      type="button"
      :disabled="seguindoBusy"
      class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60"
      :class="
        seguindo
          ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
          : 'bg-black text-white hover:opacity-90'
      "
      @click="emit('seguir')"
    >
      <UserCheck v-if="seguindo" :size="16" aria-hidden="true" />
      <UserPlus v-else :size="16" aria-hidden="true" />
      {{ seguindo ? 'Seguindo' : 'Seguir' }}
    </button>
  </aside>
</template>
