<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { isAxiosError, isCancel } from 'axios'
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, RefreshCw, Send, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useSocialProfileStore } from '@/stores/social-profile.store'
import { toApiError } from '@/lib/api/types/api-error'
import { commentService } from '../services/comment.service'
import { postService } from '../services/post.service'
import type { Comentario, ComentarioOrdem, Post } from '../types/community.types'
import { authorHandle, authorName, formatFullDate, formatRelativeShort, splitContent, wasEdited } from '../utils/format'
import CommentCard from '../components/CommentCard.vue'
import LikeButton from '../components/LikeButton.vue'
import PostMedia from '../components/PostMedia.vue'
import UserAvatar from '../components/UserAvatar.vue'

const props = defineProps<{ postId: number }>()

const auth = useAuthStore()
const socialProfile = useSocialProfileStore()

const post = ref<Post | null>(null)
const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const errorMessage = ref('')

const liked = ref(false)
const likes = ref(0)
const likeBusy = ref(false)

const comments = ref<Comentario[]>([])
const commentsStatus = ref<'loading' | 'ready' | 'error'>('loading')
const commentsError = ref('')
const commentOrder = ref<ComentarioOrdem>('relevantes')

const draft = ref('')
const replyingTo = ref<Comentario | null>(null)
const sending = ref(false)
const sendError = ref('')
const MAX_COMMENT = 1000

let controller: AbortController | null = null

const parts = computed(() => (post.value ? splitContent(post.value.conteudo) : { text: '', media: [] }))
const name = computed(() => authorName(post.value?.autor))
const handle = computed(() => authorHandle(post.value?.autor))
const edited = computed(() => wasEdited(post.value?.data_criacao, post.value?.data_atualizacao))

function countAll(list: Comentario[]): number {
  return list.reduce((sum, c) => sum + 1 + countAll(c.respostas), 0)
}

const totalComments = computed(() => countAll(comments.value))

/** Só os comentários raiz são reordenados; as respostas seguem em ordem cronológica. */
const sortedComments = computed(() => {
  const list = [...comments.value]
  if (commentOrder.value === 'recentes') {
    return list.sort((a, b) => b.data_criacao.localeCompare(a.data_criacao))
  }
  return list.sort(
    (a, b) =>
      b.total_curtidas - a.total_curtidas ||
      b.respostas.length - a.respostas.length ||
      b.data_criacao.localeCompare(a.data_criacao),
  )
})

const replyTargetName = computed(() => (replyingTo.value ? authorName(replyingTo.value.autor) : name.value))
const canSend = computed(() => draft.value.trim().length > 0 && !sending.value)

async function loadComments(signal: AbortSignal): Promise<void> {
  commentsStatus.value = 'loading'
  commentsError.value = ''

  try {
    comments.value = await commentService.listByPost(props.postId, auth.usuario?.id??0, signal)
    commentsStatus.value = 'ready'
  } catch (error) {
    if (isCancel(error)) return
    commentsError.value = toApiError(error).mensagem
    commentsStatus.value = 'error'
  }
}

async function toggleLike(): Promise<void> {
  if (!post.value || likeBusy.value) return
  const previous = { liked: liked.value, likes: likes.value }

  likeBusy.value = true
  liked.value = !previous.liked
  likes.value = Math.max(0, previous.likes + (liked.value ? 1 : -1))

  try {
    const result = await postService.toggleLike(post.value.id, auth.usuario?.id??0)
    liked.value = result.curtiu
    likes.value = result.total_curtidas
  } catch {
    liked.value = previous.liked
    likes.value = previous.likes
  } finally {
    likeBusy.value = false
  }
}

function startReply(comment: Comentario): void {
  replyingTo.value = comment
  sendError.value = ''
  document.getElementById('comment-composer')?.focus()
}

function insertComment(created: Comentario): void {
  if (created.id_comentario_pai === null) {
    comments.value = [...comments.value, created]
    return
  }

  const attach = (list: Comentario[]): Comentario[] =>
    list.map((c) =>
      c.id === created.id_comentario_pai
        ? { ...c, respostas: [...c.respostas, created] }
        : { ...c, respostas: attach(c.respostas) },
    )
  comments.value = attach(comments.value)
}

async function submitComment(): Promise<void> {
  const mensagem = draft.value.trim()
  if (!mensagem || sending.value) return

  sending.value = true
  sendError.value = ''

  try {
    const created = await commentService.create({
      idUsuario: auth.usuario?.id??0,
      idPost: props.postId,
      mensagem,
      idComentarioPai: replyingTo.value?.id ?? null,
    })

    // Se a API ainda não devolver o autor, usa o perfil social do próprio usuário.
    if (!created.autor.nome_exibicao && socialProfile.perfil) {
      const p = socialProfile.perfil
      created.autor = {
        id: p.id,
        nome_exibicao: p.nome_exibicao,
        username_social: p.username_social,
        foto_perfil: p.foto_perfil,
      }
    }

    insertComment(created)
    draft.value = ''
    replyingTo.value = null
  } catch (error) {
    sendError.value = toApiError(error).mensagem
  } finally {
    sending.value = false
  }
}

async function load(): Promise<void> {
  controller?.abort()
  controller = new AbortController()

  status.value = 'loading'
  errorMessage.value = ''
  post.value = null
  comments.value = []
  replyingTo.value = null
  draft.value = ''
  sendError.value = ''
  const { signal } = controller

  try {
    post.value = await postService.getPost(props.postId, auth.usuario?.id??0, signal)
    liked.value = post.value.curtiu
    likes.value = post.value.total_curtidas
    status.value = 'ready'
    void loadComments(signal)
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
    <div v-if="status === 'loading'" class="animate-pulse space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/50" aria-busy="true" aria-label="Carregando publicação">
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
    <div v-else-if="status === 'not-found'" class="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-border/50">
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
    <div v-else-if="status === 'error'" role="alert" class="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-border/50">
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
    <article v-else-if="post" class="space-y-5 rounded-2xl bg-white p-6 text-card-foreground shadow-sm ring-1 ring-border/50 sm:p-8">
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

      <div class="flex items-center gap-1 border-t border-border/60 pt-3 text-muted-foreground">
        <LikeButton :liked="liked" :count="likes" :busy="likeBusy" @toggle="toggleLike" />
        <span class="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium">
          <MessageCircle class="size-4" aria-hidden="true" />
          <span class="tabular-nums">{{ commentsStatus === 'ready' ? totalComments : post.total_comentarios }}</span>
        </span>
      </div>
    </article>

    <!-- Respostas -->
    <section v-if="post" class="mt-6" aria-labelledby="comments-title">
      <div class="mb-3 flex items-center justify-between">
        <h2 id="comments-title" class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Respostas</h2>
        <div class="flex items-center gap-1 text-xs">
          <button
            v-for="option in ([['relevantes', 'Mais relevantes'], ['recentes', 'Mais recentes']] as const)"
            :key="option[0]"
            type="button"
            :aria-pressed="commentOrder === option[0]"
            class="rounded-full px-3 py-1 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="commentOrder === option[0] ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="commentOrder = option[0]"
          >
            {{ option[1] }}
          </button>
        </div>
      </div>

      <div v-if="commentsStatus === 'loading'" class="flex justify-center py-8 text-muted-foreground" role="status" aria-label="Carregando respostas">
        <Loader2 class="size-5 animate-spin" aria-hidden="true" />
      </div>

      <div v-else-if="commentsStatus === 'error'" role="alert" class="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-border/50">
        <p class="text-sm font-medium text-foreground">Não foi possível carregar as respostas.</p>
        <p class="mt-1 text-sm text-muted-foreground">{{ commentsError }}</p>
        <button
          type="button"
          class="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          @click="controller && loadComments(controller.signal)"
        >
          <RefreshCw class="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>

      <p v-else-if="comments.length === 0" class="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-border/50">
        Ainda não há respostas. Seja a primeira pessoa a comentar.
      </p>

      <ul v-else class="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border/50 sm:p-6">
        <CommentCard v-for="comment in sortedComments" :key="comment.id" :comment="comment" @reply="startReply" />
      </ul>

      <!-- Composer -->
      <form
        class="sticky bottom-4 z-10 mt-4 rounded-2xl bg-white p-3 shadow-md ring-1 ring-border"
        @submit.prevent="submitComment"
      >
        <div v-if="replyingTo" class="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <span class="truncate">Respondendo a <strong class="font-semibold text-foreground">{{ replyTargetName }}</strong></span>
          <button type="button" class="rounded p-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Cancelar resposta" @click="replyingTo = null">
            <X class="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div class="flex items-end gap-2">
          <label for="comment-composer" class="sr-only">Escreva uma resposta</label>
          <textarea
            id="comment-composer"
            v-model="draft"
            rows="1"
            :maxlength="MAX_COMMENT"
            :placeholder="`Escreva uma resposta para ${replyTargetName}...`"
            class="max-h-40 min-h-10 flex-1 resize-none rounded-xl bg-white px-4 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:bg-white focus:ring-2 focus:ring-ring/40"
            @keydown.enter.exact.prevent="submitComment"
          />
          <button
            type="submit"
            :disabled="!canSend"
            class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <Loader2 v-if="sending" class="size-4 animate-spin" aria-hidden="true" />
            <Send v-else class="size-4" aria-hidden="true" />
            Responder
          </button>
        </div>
        <p v-if="sendError" role="alert" class="mt-2 text-xs text-destructive">{{ sendError }}</p>
      </form>
    </section>
  </section>
</template>
