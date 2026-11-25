<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Bookmark, MessageSquare } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { postService } from '../services/post.service'
import type { Post } from '../types/community.types'
import { ui } from '../ui'
import { authorHandle, authorName, formatFullDate, formatRelativeShort, splitContent } from '../utils/format'
import LikeButton from './LikeButton.vue'
import PostActionsMenu from './PostActionsMenu.vue'
import PostMedia from './PostMedia.vue'
import UserAvatar from './UserAvatar.vue'

const props = defineProps<{ post: Post }>()
const emit = defineEmits<{ savedChange: [idPost: number, salvo: boolean] }>()

const auth = useAuthStore()
const router = useRouter()

const parts = computed(() => splitContent(props.post.conteudo))
const name = computed(() => authorName(props.post.autor))
const handle = computed(() => authorHandle(props.post.autor))
/** Não se denuncia o próprio post (o backend recusa com DENUNCIA_PROPRIO_POST). */
const isOwn = computed(() => Number(props.post.id_usuario) === auth.usuario?.id)

const liked = ref(props.post.curtiu)
const likes = ref(props.post.total_curtidas)
const busy = ref(false)
const saved = ref(Boolean(props.post.salvo))
const saving = ref(false)
const checkingSaved = ref(props.post.salvo === undefined)

watch(
  () => [props.post.curtiu, props.post.total_curtidas] as const,
  ([curtiu, total]) => {
    liked.value = curtiu
    likes.value = total
  },
)

watch(() => props.post.salvo, (value) => {
  if (value !== undefined) saved.value = value
})

onMounted(async () => {
  if (props.post.salvo !== undefined) return
  try {
    saved.value = await postService.isSaved(props.post.id)
  } catch {
    // A falha de verificação não impede salvar ou abrir a publicação.
  } finally {
    checkingSaved.value = false
  }
})

/**
 * O card inteiro abre o post, exceto cliques em botões e links (curtir, nome do autor).
 * Feito por evento (e não por link sobreposto) para o botão de curtir nunca ser coberto.
 */
function openPost(event: MouseEvent): void {
  if ((event.target as HTMLElement).closest('a, button')) return
  void router.push({ name: 'community-post', params: { id: props.post.id } })
}

/** Atualização otimista; reverte se a API falhar. */
async function toggleLike(): Promise<void> {
  if (busy.value) return
  const previous = { liked: liked.value, likes: likes.value }

  busy.value = true
  liked.value = !previous.liked
  likes.value = Math.max(0, previous.likes + (liked.value ? 1 : -1))

  try {
    const result = await postService.toggleLike(props.post.id, auth.usuario?.id??0)
    liked.value = result.curtiu
    likes.value = result.total_curtidas
  } catch {
    liked.value = previous.liked
    likes.value = previous.likes
  } finally {
    busy.value = false
  }
}

async function toggleSaved(): Promise<void> {
  if (saving.value) return
  const previous = saved.value
  saving.value = true
  saved.value = !previous

  try {
    saved.value = await postService.toggleSaved(props.post.id)
    emit('savedChange', props.post.id, saved.value)
  } catch {
    saved.value = previous
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <article
    :class="[ui.card, ui.cardHover, 'flex h-full min-h-44 cursor-pointer flex-col gap-3 p-4']"
    @click="openPost"
  >
    <header class="flex items-center gap-3">
      <RouterLink
        :to="{ name: 'community-public-profile', params: { username: post.autor?.username_social } }"
        class="flex items-center gap-3"
      >
        <UserAvatar :src="post.autor?.foto_perfil" :name="name" size="md" />
      </RouterLink>
      <div class="min-w-0">
        <RouterLink
          :to="{ name: 'community-public-profile', params: { username: post.autor?.username_social } }"
          class="block truncate text-sm font-semibold leading-tight text-neutral-900 outline-none hover:underline focus-visible:underline"
        >
          {{ name }}
        </RouterLink>
        <p class="truncate text-[11px] text-neutral-400">
          <span v-if="handle">{{ handle }} · </span>
          <time :datetime="post.data_criacao" :title="formatFullDate(post.data_criacao)">
            {{ formatRelativeShort(post.data_criacao) }}
          </time>
        </p>
      </div>
      <PostActionsMenu v-if="!isOwn" :post-id="post.id" class="ml-auto" />
    </header>

    <p
      v-if="parts.text"
      class="line-clamp-6 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-700"
    >
      {{ parts.text }}
    </p>
    <p v-else-if="!parts.media.length" class="text-sm italic text-neutral-400">Publicação sem conteúdo.</p>

    <div v-if="parts.media.length" class="pointer-events-none">
      <PostMedia :items="parts.media" compact :limit="4" />
    </div>

    <footer class="mt-auto flex items-center justify-between pt-1">
      <div class="flex items-center gap-4">
        <LikeButton :liked="liked" :count="likes" :busy="busy" @toggle="toggleLike" />
        <span
          class="inline-flex items-center gap-1.5 text-xs text-neutral-500"
          :aria-label="`${post.total_comentarios} comentários`"
        >
          <MessageSquare class="size-4" aria-hidden="true" />
          <span class="tabular-nums">{{ post.total_comentarios }}</span>
        </span>
      </div>
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-md text-neutral-500 outline-none transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-black/30 disabled:opacity-60"
        :aria-label="saved ? 'Remover post dos salvos' : 'Salvar post'"
        :aria-pressed="saved"
        :disabled="saving || checkingSaved"
        @click.stop.prevent="toggleSaved"
      >
        <Bookmark :class="['size-4', saved ? 'fill-current text-neutral-900' : '']" aria-hidden="true" />
      </button>
    </footer>
  </article>
</template>
