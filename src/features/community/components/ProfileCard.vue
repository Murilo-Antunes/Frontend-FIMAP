<script setup lang="ts">
import { computed } from 'vue'
import { UserPlus, UserCheck } from 'lucide-vue-next'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import type { PerfilUsuario } from '../types/profile.types'
import { tituloNivel } from '../utils/nivel'

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

const nome = computed(() => props.perfil.nome_exibicao || props.perfil.nome)
const handle = computed(() => (props.perfil.username_social ? `@${props.perfil.username_social}` : ''))

// ⚠️ "Membro desde" depende de uma data de cadastro que não existe em
// tbl_usuario hoje (ver types/profile.types.ts). Só renderiza se vier.
const membroDesde = computed(() => {
  if (!props.perfil.data_entrada) return null
  return new Date(props.perfil.data_entrada).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
})

const postsMaisRespostas = computed(
  () => (props.perfil as any).total_posts_respostas ?? undefined,
)
</script>

<template>
  <aside class="flex h-fit flex-col gap-5 rounded-2xl bg-white p-6 ring-1 ring-border/50">
    <div class="flex items-start justify-between">
      <UserAvatar :src="perfil.foto_perfil" :name="nome" size="lg" />
      <span
        v-if="mode === 'public'"
        class="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700"
      >
        🏆 Nível {{ perfil.nivel_total }} · {{ tituloNivel(perfil.nivel_total) }}
      </span>
    </div>

    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold text-foreground">{{ nome }}</h1>
        <!-- ⚠️ "plano" não existe hoje em tbl_usuario; confirme a origem do selo PRO -->
        <span
          v-if="perfil.plano === 'PRO'"
          class="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background"
        >
          PRO
        </span>
      </div>
      <p v-if="handle" class="text-sm text-muted-foreground">{{ handle }}</p>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span v-if="membroDesde">Membro desde {{ membroDesde }}</span>
        <span v-if="perfil.localizacao_estado">{{ perfil.localizacao_estado }}</span>
      </div>
    </div>

    <p v-if="perfil.biografia_social" class="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
      {{ perfil.biografia_social }}
    </p>

    <div class="flex items-center gap-6 border-t border-border/60 pt-4 text-center">
      <div>
        <p class="text-base font-semibold tabular-nums text-foreground">
          {{ postsMaisRespostas ?? '—' }}
        </p>
        <p class="text-xs text-muted-foreground">Posts &amp; Resp.</p>
      </div>
      <div>
        <p class="text-base font-semibold tabular-nums text-foreground">{{ perfil.total_seguidores }}</p>
        <p class="text-xs text-muted-foreground">Seguidores</p>
      </div>
      <div>
        <p class="text-base font-semibold tabular-nums text-foreground">{{ perfil.total_seguindo }}</p>
        <p class="text-xs text-muted-foreground">Seguindo</p>
      </div>
    </div>

    <button
      v-if="mode === 'own'"
      type="button"
      class="w-full rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
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
          ? 'bg-neutral-100 text-foreground hover:bg-neutral-200'
          : 'bg-foreground text-background hover:opacity-90'
      "
      @click="emit('seguir')"
    >
      <UserCheck v-if="seguindo" :size="16" aria-hidden="true" />
      <UserPlus v-else :size="16" aria-hidden="true" />
      {{ seguindo ? 'Seguindo' : 'Seguir' }}
    </button>
  </aside>
</template>
