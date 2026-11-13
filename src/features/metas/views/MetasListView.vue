<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { metasService } from '../services/metas.service'
import { categoriasService } from '../services/categorias.service'
import type { CategoriaMeta, Meta, PrazoMeta } from '../types/metas.types'
import { classificarPrazo, mapearMetaApi } from '../utils/metas.utils'
import CardProgressoGeral from '../components/CardProgressoGeral.vue'
import FiltroPrazo from '../components/FiltroPrazo.vue'
import CardMetaResumo from '../components/CardMetaResumo.vue'

const router = useRouter()
const authStore = useAuthStore()

const carregando = ref(true)
const erro = ref<string | null>(null)
const metas = ref<Meta[]>([])
const categorias = ref<CategoriaMeta[]>([])
const filtroPrazo = ref<PrazoMeta | 'todas'>('todas')

const categoriaPorId = computed(() => new Map(categorias.value.map((c) => [c.id, c])))

const metasFiltradas = computed(() => {
  if (filtroPrazo.value === 'todas') return metas.value
  return metas.value.filter((meta) => classificarPrazo(meta.dataAlvo) === filtroPrazo.value)
})

async function carregar() {
  carregando.value = true
  erro.value = null
  try {
    const idUsuario = authStore.usuario?.id
    const [metasApi, categoriasApi] = await Promise.all([
      metasService.listar(idUsuario??0),
      categoriasService.listar(idUsuario??0),
    ])
    metas.value = metasApi.map(mapearMetaApi)
    categorias.value = categoriasApi
  } catch (e) {
    erro.value = 'Não foi possível carregar suas metas agora.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

function abrirMeta(id: number) {
  router.push({ name: 'metas-editar', params: { id } })
}

function criarMeta() {
  router.push({ name: 'metas-criar' })
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-8">
    <h1 class="text-2xl font-semibold text-gray-900">Metas Financeiras</h1>
    <p class="text-sm text-gray-400">Acompanhe e acelere suas conquistas</p>

    <div class="mt-6">
      <CardProgressoGeral v-if="!carregando" :metas="metas" />
    </div>

    <div v-if="erro" class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ erro }}
    </div>

    <div v-if="!carregando" class="mt-6">
      <FiltroPrazo v-model="filtroPrazo" :total="metas.length" />
    </div>

    <div v-if="carregando" class="mt-10 text-center text-sm text-gray-400">Carregando metas…</div>

    <template v-else>
      <div v-if="metasFiltradas.length > 0" class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardMetaResumo
          v-for="meta in metasFiltradas"
          :key="meta.id"
          :meta="meta"
          :categoria="categoriaPorId.get(meta.idCategoria)"
          @abrir="abrirMeta(meta.id)"
        />
      </div>
      <p v-else class="mt-10 text-center text-sm text-gray-400">
        Nenhuma meta encontrada para esse prazo.
      </p>

      <button
        type="button"
        class="mt-6 flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-900"
        @click="criarMeta"
      >
        <Plus class="h-4 w-4" />
        Criar Nova Meta Financeira
      </button>
    </template>
  </div>
</template>
