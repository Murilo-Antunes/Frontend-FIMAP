<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { isAxiosError, isCancel } from 'axios'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { toApiError } from '@/lib/api/types/api-error'
import { postService } from '../services/post.service'
import type { Post } from '../types/community.types'
import { authorHandle, authorName, formatFullDate, formatRelativeShort, splitContent, wasEdited } from '../utils/format'
import PostMedia from '../components/PostMedia.vue'
import UserAvatar from '../components/UserAvatar.vue'

const props = defineProps<{ postId: number }>()

const post = ref<Post | null>(null)
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const errorMessage = ref('')

let controller: AbortController | null = null

const parts = computed(() => (post.value ? splitContent(post.value.conteudo) : { text: '', media: [] }))
const name = computed(() => authorName(post.value?.autor))
const handle = computed(() => authorHandle(post.value?.autor))
const edited = computed(() => wasEdited(post.value?.data_criacao, post.value?.data_atualizacao))

async function load(): Promise<void> {
  controller?.abort()
  controller = new AbortController()

  status.value = 'loading'
  errorMessage.value = ''
  post.value = null

  try {
    post.value = await postService.getPost(props.postId, controller.signal)
    status.value = 'ready'
  } catch (error) {
    if (isCancel(error)) return

    if (isAxiosError(error) && error.response?.status === 404) {
      status.value = 'not-found'
      return
    }
    errorMessage.value = toApiError(error).mensagem
    status.value = 'error'
  }
}

watch(() => props.postId, () => void load(), { immediate: true })

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
    <p class="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      Comunidade • Publicação
    </p>

    <!-- Carregando -->
    <div v-if="status === 'loading'" class="animate-pulse space-y-5 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/50" aria-busy="true" aria-label="Carregando publicação">
      <div class="flex items-center gap-3">
        <div class="size-12 rounded-full bg-muted" />
        <div class="space-y-2">
          <div class="h-3.5 w-36 rounded bg-muted" />
          <div class="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div class="space-y-2.5">
        <div class="h-3.5 w-full rounded bg-muted" />
        <div class="h-3.5 w-11/12 rounded bg-muted" />
        <div class="h-3.5 w-3/5 rounded bg-muted" />
      </div>
    </div>

    <!-- Não encontrado -->
    <div v-else-if="status === 'not-found'" class="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/50">
      <p class="text-base font-semibold text-foreground">Publicação não encontrada</p>
      <p class="mt-1 text-sm text-muted-foreground">Ela pode ter sido removida pelo autor.</p>
      <RouterLink
        :to="{ name: 'community' }"
        class="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        Voltar à comunidade
      </RouterLink>
    </div>

    <!-- Erro -->
    <div v-else-if="status === 'error'" role="alert" class="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/50">
      <AlertCircle class="mx-auto size-6 text-destructive" aria-hidden="true" />
      <p class="mt-2 text-sm font-medium text-foreground">Não foi possível carregar a publicação.</p>
      <p class="mt-1 text-sm text-muted-foreground">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        @click="load"
      >
        <RefreshCw class="size-4" aria-hidden="true" />
        Tentar novamente
      </button>
    </div>

    <!-- Post -->
    <article v-else-if="post" class="space-y-5 rounded-2xl bg-card p-6 text-card-foreground shadow-sm ring-1 ring-border/50 sm:p-8">
      <header class="flex items-center gap-3">
        <UserAvatar :src="post.autor?.foto_perfil" :name="name" size="lg" />
        <div class="min-w-0">
          <h1 class="truncate text-base font-semibold leading-tight text-foreground">{{ name }}</h1>
          <p class="truncate text-xs text-muted-foreground">
            <span v-if="handle">{{ handle }} • </span>
            <time :datetime="post.data_criacao" :title="formatFullDate(post.data_criacao)">
              {{ formatRelativeShort(post.data_criacao) }}
            </time>
            <span v-if="edited"> • Editado</span>
          </p>
        </div>
      </header>

      <p v-if="parts.text" class="whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/90">
        {{ parts.text }}
      </p>
      <p v-else-if="!parts.media.length" class="text-sm italic text-muted-foreground">Publicação sem conteúdo.</p>

      <PostMedia v-if="parts.media.length" :items="parts.media" />

      <!-- Curtidas, comentários e respostas entram aqui quando a API existir. -->
    </article>
  </section>
</template>
