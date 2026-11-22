<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { isCancel } from 'axios'
import { refDebounced } from '@vueuse/core'
import { Loader2, Newspaper, RefreshCw, Search, AlertCircle, SquarePen } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { toApiError } from '@/lib/api/types/api-error'
import { postService } from '../services/post.service'
import type { FeedOrdem, Post } from '../types/community.types'
import PostCard from '../components/PostCard.vue'
import PostCardSkeleton from '../components/PostCardSkeleton.vue'
import NewPostDialog from '../components/NewPostDialog.vue'
import { ui } from '../ui'

const PAGE_SIZE = 12

const auth = useAuthStore()

const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
const loadingMore = ref(false)
const loadMoreError = ref('')

const search = ref('')
const debouncedSearch = refDebounced(search, 400)
const ordem = ref<FeedOrdem>('recentes')
const newPostOpen = ref(false)

let controller: AbortController | null = null

const hasMore = computed(() => posts.value.length < total.value)
const isSearching = computed(() => debouncedSearch.value.trim().length > 0)

/** Evita post duplicado quando entram posts novos entre uma página e outra. */
function mergeUnique(current: Post[], incoming: Post[]): Post[] {
  const seen = new Set(current.map((post) => post.id))
  return [...current, ...incoming.filter((post) => !seen.has(post.id))]
}

async function load(reset: boolean): Promise<void> {
  controller?.abort()
  controller = new AbortController()

  const nextPage = reset ? 1 : page.value + 1

  if (reset) {
    status.value = 'loading'
    errorMessage.value = ''
    loadMoreError.value = ''
  } else {
    loadingMore.value = true
    loadMoreError.value = ''
  }

  try {
    const result = await postService.listFeed(
      { pagina: nextPage, limite: PAGE_SIZE, ordem: ordem.value, busca: debouncedSearch.value },
      auth.usuario?.id??0,
      controller.signal,
    )

    posts.value = reset ? result.posts : mergeUnique(posts.value, result.posts)
    total.value = result.total
    page.value = nextPage
    status.value = 'ready'
  } catch (error) {
    if (isCancel(error)) return

    const message = toApiError(error).mensagem
    if (reset) {
      status.value = 'error'
      errorMessage.value = message
    } else {
      loadMoreError.value = message
    }
  } finally {
    if (!reset) loadingMore.value = false
  }
}

/** Post recém-criado entra no topo do feed (sem recarregar). */
function onPostCreated(post: Post): void {
  if (status.value !== 'ready') status.value = 'ready'
  if (ordem.value === 'recentes' && !isSearching.value) {
    posts.value = mergeUnique([post], posts.value)
  } else {
    posts.value = mergeUnique(posts.value, [post])
  }
  total.value += 1
}

watch([debouncedSearch, ordem], () => void load(true), { immediate: true })

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div :class="ui.page">
    <section class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <!-- Busca -->
      <form role="search" class="relative" @submit.prevent>
        <label for="community-search" class="sr-only">Buscar publicações</label>
        <Search class="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          id="community-search"
          v-model="search"
          type="search"
          autocomplete="off"
          maxlength="100"
          placeholder="Buscar tópicos, dúvidas ou ativos..."
          :class="[ui.fieldGray, 'h-11 w-full pl-12 pr-5']"
        />
      </form>

      <!-- Cabeçalho do feed -->
      <div class="mb-3 mt-8 flex items-center justify-between">
        <h1 :class="ui.eyebrow">Feed da comunidade</h1>
        <div class="flex items-center gap-2">
          <label for="community-order" class="sr-only">Ordenar publicações</label>
          <select
            id="community-order"
            v-model="ordem"
            class="cursor-pointer rounded-md bg-transparent py-1 text-xs text-neutral-500 outline-none transition hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <option value="recentes">Recentes</option>
            <option value="antigos">Mais antigos</option>
          </select>
        </div>
      </div>

      <!-- Carregando -->
      <div v-if="status === 'loading'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando publicações">
        <PostCardSkeleton v-for="n in 6" :key="n" />
      </div>

      <!-- Erro -->
      <div v-else-if="status === 'error'" role="alert" :class="[ui.card, 'p-8 text-center']">
        <AlertCircle class="mx-auto size-6 text-red-500" aria-hidden="true" />
        <p class="mt-2 text-sm font-medium text-neutral-900">Não foi possível carregar o feed.</p>
        <p class="mt-1 text-sm text-neutral-500">{{ errorMessage }}</p>
        <button type="button" :class="[ui.btnBlack, 'mt-4']" @click="load(true)">
          <RefreshCw class="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>

      <!-- Vazio -->
      <div v-else-if="posts.length === 0" :class="[ui.card, 'p-10 text-center']">
        <Newspaper class="mx-auto size-6 text-neutral-400" aria-hidden="true" />
        <p class="mt-2 text-sm font-medium text-neutral-900">
          {{ isSearching ? 'Nenhuma publicação encontrada.' : 'Ainda não há publicações na comunidade.' }}
        </p>
        <p class="mt-1 text-sm text-neutral-500">
          {{ isSearching ? 'Tente buscar por outro termo.' : 'Quando alguém publicar, o post aparece aqui.' }}
        </p>
      </div>

      <!-- Feed -->
      <template v-else>
        <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="post in posts" :key="post.id">
            <PostCard :post="post" />
          </li>
        </ul>

        <div class="mt-6 flex flex-col items-center gap-2">
          <p v-if="loadMoreError" role="alert" class="text-sm text-red-600">{{ loadMoreError }}</p>
          <button v-if="hasMore" type="button" :disabled="loadingMore" :class="ui.btnGray" @click="load(false)">
            <Loader2 v-if="loadingMore" class="size-4 animate-spin" aria-hidden="true" />
            {{ loadMoreError ? 'Tentar novamente' : 'Carregar mais' }}
          </button>
          <p v-else class="text-xs text-neutral-400">Você chegou ao fim do feed.</p>
        </div>
      </template>

      <!-- Novo post -->
      <div class="pointer-events-none sticky bottom-6 z-10 mt-6 flex justify-end">
        <button type="button" :class="[ui.btnBlack, 'pointer-events-auto h-11 px-6 shadow-lg']" @click="newPostOpen = true">
          <SquarePen class="size-4" aria-hidden="true" />
          Novo Post
        </button>
      </div>
    </section>

    <NewPostDialog v-model:open="newPostOpen" @created="onPostCreated" />
  </div>
</template>
