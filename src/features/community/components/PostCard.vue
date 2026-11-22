<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { MessageSquare } from 'lucide-vue-next'
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

watch(
  () => [props.post.curtiu, props.post.total_curtidas] as const,
  ([curtiu, total]) => {
    liked.value = curtiu
    likes.value = total
  },
)

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
</script>

<template>
  <article
    :class="[ui.card, ui.cardHover, 'flex h-full min-h-44 cursor-pointer flex-col gap-3 p-4']"
    @click="openPost"
  >
    <header class="flex items-center gap-3">
      <UserAvatar :src="post.autor?.foto_perfil" :name="name" size="md" />
      <div class="min-w-0">
        <RouterLink
          :to="{ name: 'community-post', params: { id: post.id } }"
          class="block truncate text-sm font-semibold leading-tight text-neutral-900 outline-none focus-visible:underline"
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

    <footer class="mt-auto flex items-center gap-4 pt-1">
      <LikeButton :liked="liked" :count="likes" :busy="busy" @toggle="toggleLike" />
      <span
        class="inline-flex items-center gap-1.5 text-xs text-neutral-500"
        :aria-label="`${post.total_comentarios} comentários`"
      >
        <MessageSquare class="size-4" aria-hidden="true" />
        <span class="tabular-nums">{{ post.total_comentarios }}</span>
      </span>
    </footer>
  </article>
</template>
