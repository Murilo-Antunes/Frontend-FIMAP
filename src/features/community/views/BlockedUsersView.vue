<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import UserAvatar from '@/features/community/components/UserAvatar.vue'
import { desbloquearUsuario, listarBloqueados } from '../services/profile.service'
import type { UsuarioBloqueado } from '../types/profile.types'

const auth = useAuthStore()
const idUsuario = computed(() => auth.usuario?.id ?? 0)

const bloqueados = ref<UsuarioBloqueado[]>([])
const carregando = ref(true)
const erro = ref<string | null>(null)
const erroAcao = ref<string | null>(null)
const processando = ref<number[]>([])

async function carregar() {
  if (!idUsuario.value) return
  carregando.value = true
  erro.value = null
  try {
    const lista = await listarBloqueados(idUsuario.value)
    bloqueados.value = Array.isArray(lista) ? lista : []
  } catch (e) {
    console.error('Erro ao carregar usuários bloqueados:', e)
    erro.value = 'Não foi possível carregar a lista agora. Tente novamente em instantes.'
  } finally {
    carregando.value = false
  }
}

/** Remove da lista na hora e devolve se a API falhar. */
async function desbloquear(usuario: UsuarioBloqueado) {
  if (processando.value.includes(usuario.id_usuario)) return
  erroAcao.value = null
  processando.value = [...processando.value, usuario.id_usuario]
  const anterior = bloqueados.value
  bloqueados.value = anterior.filter((b) => b.id_usuario !== usuario.id_usuario)

  try {
    await desbloquearUsuario(idUsuario.value, usuario.id_usuario)
  } catch (e) {
    console.error('Erro ao desbloquear:', e)
    bloqueados.value = anterior
    erroAcao.value = 'Não foi possível desbloquear agora. Tente novamente.'
  } finally {
    processando.value = processando.value.filter((id) => id !== usuario.id_usuario)
  }
}

onMounted(carregar)
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-[60px]">
    <div class="max-w-3xl">
      <h1 class="text-xl font-semibold text-neutral-900">Usuários Bloqueados</h1>
      <p class="mt-1 text-sm leading-relaxed text-neutral-500">
        Quem você bloqueia não vê seu perfil, não te segue e não comenta nos seus posts.
      </p>

      <p v-if="erroAcao" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ erroAcao }}
      </p>

      <div v-if="carregando" class="py-16 text-center text-sm text-neutral-500">Carregando…</div>

      <div v-else-if="erro" class="flex flex-col items-center gap-3 py-16 text-center">
        <p class="text-sm text-neutral-500">{{ erro }}</p>
        <button
          type="button"
          class="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          @click="carregar"
        >
          Tentar novamente
        </button>
      </div>

      <p v-else-if="!bloqueados.length" class="mt-8 rounded-2xl bg-white px-6 py-10 text-center text-sm text-neutral-500 shadow-sm">
        Você não bloqueou ninguém.
      </p>

      <ul v-else class="mt-6 rounded-2xl bg-white shadow-sm">
        <template v-for="(usuario, i) in bloqueados" :key="usuario.id_usuario">
          <li v-if="i > 0"><div class="mx-4 h-px bg-neutral-100" role="separator" /></li>
          <li class="flex items-center justify-between gap-4 px-4 py-3">
            <div class="flex min-w-0 items-center gap-3">
              <UserAvatar :src="usuario.foto_perfil" :name="usuario.nome_exibicao" size="md" />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-neutral-900">{{ usuario.nome_exibicao }}</p>
                <p v-if="usuario.username_social" class="truncate text-xs text-neutral-500">
                  @{{ usuario.username_social }}
                </p>
              </div>
            </div>
            <button
              type="button"
              :disabled="processando.includes(usuario.id_usuario)"
              class="shrink-0 rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-60"
              @click="desbloquear(usuario)"
            >
              Desbloquear
            </button>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
