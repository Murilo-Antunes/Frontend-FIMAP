<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { postService } from '../services/post.service'
import type { Post } from '../types/community.types'
import { authorHandle, authorName, formatFullDate, formatRelativeShort, splitContent } from '../utils/format'
import LikeButton from './LikeButton.vue'
import PostMedia from './PostMedia.vue'
import UserAvatar from './UserAvatar.vue'

const props = defineProps<{ post: Post }>()

const auth = useAuthStore()

const parts = computed(() => splitContent(props.post.conteudo))
const name = computed(() => authorName(props.post.autor))
const handle = computed(() => authorHandle(props.post.autor))

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
  <!-- O link cobre o card inteiro (after:inset-0); o botão de curtir fica acima dele. -->
  <article
    class="group relative flex h-full min-h-56 flex-col gap-4 rounded-2xl bg-card p-5 text-card-foreground shadow-sm ring-1 ring-border/50 transition focus-within:ring-2 focus-within:ring-ring hover:shadow-md"
  >
    <header class="flex items-center gap-3">
      <UserAvatar :src="post.autor?.foto_perfil" :name="name" size="md" />
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold leading-tight text-foreground">
          <RouterLink
            :to="{ name: 'community-post', params: { id: post.id } }"
            class="outline-none after:absolute after:inset-0 after:rounded-2xl"
            :aria-label="`Abrir publicação de ${name}`"
          >
            {{ name }}
          </RouterLink>
        </p>
        <p class="truncate text-xs text-muted-foreground">
          <span v-if="handle">{{ handle }} · </span>
          <time :datetime="post.data_criacao" :title="formatFullDate(post.data_criacao)">
            {{ formatRelativeShort(post.data_criacao) }}
          </time>
        </p>
      </div>
    </header>

    <p
      v-if="parts.text"
      class="line-clamp-6 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/90"
    >
      {{ parts.text }}
    </p>
    <p v-else-if="!parts.media.length" class="text-sm italic text-muted-foreground">
      Publicação sem conteúdo.
    </p>

    <div v-if="parts.media.length" class="pointer-events-none">
      <PostMedia :items="parts.media" compact :limit="4" />
    </div>

    <footer class="relative z-10 mt-auto flex items-center gap-1 pt-1 text-muted-foreground">
      <LikeButton :liked="liked" :count="likes" :busy="busy" @toggle="toggleLike" />
      <span class="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium" :aria-label="`${post.total_comentarios} comentários`">
        <MessageCircle class="size-4" aria-hidden="true" />
        <span class="tabular-nums">{{ post.total_comentarios }}</span>
      </span>
    </footer>
  </article>
</template>
