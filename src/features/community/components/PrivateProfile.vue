<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, Lock, Share2, ShieldCheck } from 'lucide-vue-next'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import type { EstadoSolicitacao, PerfilUsuario, TipoSolicitacao } from '../types/profile.types'
import { formatarMesAno } from '../utils/format-safe'

const props = defineProps<{
  perfil: PerfilUsuario
  estado: EstadoSolicitacao
  /** Enviando/cancelando uma solicitação. */
  busy?: boolean
  erro?: string | null
}>()

const emit = defineEmits<{
  solicitar: [tipo: TipoSolicitacao]
  cancelar: []
}>()

const nome = computed(() => props.perfil.nome_exibicao || props.perfil.nome || 'Usuário')
const handle = computed(() => (props.perfil.username_social ? `@${props.perfil.username_social}` : 'este usuário'))
const membroDesde = computed(() => formatarMesAno(props.perfil.data_cadastro))
const pendente = computed(() => props.estado === 'pendente')
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold tracking-wide text-neutral-900">
        COMUNIDADE FIMAP
      </span>
      <button
        type="button"
        class="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition hover:bg-neutral-200"
        aria-label="Compartilhar perfil"
      >
        <Share2 :size="16" />
      </button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
      <!-- Cartão do usuário -->
      <aside class="flex h-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <div class="relative">
          <UserAvatar :src="perfil.foto_perfil" :name="nome" size="lg" />
          <span
            class="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-black text-white"
            aria-hidden="true"
          >
            <Lock :size="14" />
          </span>
        </div>

        <div class="text-center">
          <h1 class="text-lg font-semibold text-neutral-900">{{ nome }}</h1>
          <p v-if="perfil.username_social" class="text-sm text-neutral-500">{{ handle }}</p>
        </div>

        <span class="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
          <Calendar :size="13" aria-hidden="true" /> Membro desde {{ membroDesde }}
        </span>

        <button
          type="button"
          :disabled="busy || pendente"
          class="mt-2 w-full rounded-full py-3.5 text-base font-medium transition disabled:cursor-not-allowed"
          :class="pendente ? 'bg-neutral-100 text-neutral-500' : 'bg-black text-white hover:opacity-90 disabled:opacity-60'"
          @click="emit('solicitar', 'conexao')"
        >
          {{ pendente ? 'Solicitação enviada' : 'Solicitar Conexão' }}
        </button>
      </aside>

      <!-- Aviso de perfil privado -->
      <div>
        <section class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="flex flex-col items-center text-center">
            <div class="relative flex size-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
              <Lock :size="24" aria-hidden="true" />
              <span class="absolute right-0 top-0 size-2 rounded-full bg-black" aria-hidden="true" />
            </div>
            <h2 class="mt-4 text-lg font-semibold text-neutral-900">Este perfil é privado</h2>
            <p class="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
              As métricas financeiras, badges, conquistas e publicações de
              <span class="text-neutral-900">{{ handle }}</span>
              são visíveis apenas para conexões aprovadas.
            </p>
          </div>

          <div class="mt-6 flex items-start gap-3 rounded-xl bg-neutral-100 p-4">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-neutral-900">
              <ShieldCheck :size="16" aria-hidden="true" />
            </span>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-900">
                Privacidade garantida Fimap
              </p>
              <p class="mt-1 max-w-[230px] text-xs leading-relaxed text-neutral-500">
                No Fimap, cada usuário escolhe a visibilidade das suas estratégias e publicações na comunidade.
              </p>
            </div>
          </div>

          <button
            type="button"
            :disabled="busy || pendente"
            class="mt-6 w-full rounded-full bg-neutral-100 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:text-neutral-500 disabled:hover:bg-neutral-100"
            @click="emit('solicitar', 'seguir')"
          >
            {{ pendente ? 'Solicitação enviada' : 'Solicitar para Seguir' }}
          </button>
        </section>

        <p v-if="erro" class="mt-4 text-center text-xs text-red-600" role="alert">{{ erro }}</p>

        <p class="mt-4 text-center text-xs text-neutral-500">
          Solicitações expiram em 30 dias se não aceitas
          <template v-if="pendente">
            ·
            <button
              type="button"
              :disabled="busy"
              class="font-medium text-neutral-900 underline-offset-2 hover:underline disabled:opacity-60"
              @click="emit('cancelar')"
            >
              Cancelar solicitação
            </button>
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
