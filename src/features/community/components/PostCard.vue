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

// ÚNICA MUDANÇA ESTRUTURAL deste arquivo em relação ao original: o avatar e o
// nome agora levam ao perfil público do autor (em vez de herdar o link do
// post). Para isso o overlay que abre o post deixou de ficar no <header> e
// passou a ser uma camada própria (z-0) por baixo do cabeçalho (z-10).
const perfilRoute = computed(() => {
  const usernameSocial = props.post.autor?.username_social
  if (!usernameSocial) return null // ⚠️ autor sem username_social (perfil ainda não configurado)
  return { name: 'community-public-profile', params: { username: usernameSocial } }
})

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
    const result = await postService.toggleLike(props.post.id, auth.usuario?.id ?? 0)
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
    class="group relative flex h-full min-h-56 flex-col gap-4 rounded-2xl bg-white p-5 text-card-foreground shadow-sm ring-1 ring-border/50 transition focus-within:ring-2 focus-within:ring-ring hover:shadow-md"
  >
    <!-- Camada que abre o post: cobre o card inteiro, mas fica ATRÁS do cabeçalho (z-0 < z-10),
         então cliques no avatar/nome são capturados pelos links do cabeçalho primeiro. -->
    <RouterLink
      :to="{ name: 'community-post', params: { id: post.id } }"
      class="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-label="`Abrir publicação de ${name}`"
    />

    <header class="relative z-10 flex items-center gap-3">
      <component :is="perfilRoute ? RouterLink : 'span'" :to="perfilRoute ?? undefined" class="shrink-0 outline-none">
        <UserAvatar :src="post.autor?.foto_perfil" :name="name" size="md" />
      </component>

      <div class="min-w-0">
        <p class="truncate text-sm font-semibold leading-tight text-foreground">
          <component
            :is="perfilRoute ? RouterLink : 'span'"
            :to="perfilRoute ?? undefined"
            class="outline-none hover:underline"
          >
            {{ name }}
          </component>
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
      class="relative z-10 line-clamp-6 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/90"
    >
      {{ parts.text }}
    </p>
    <p v-else-if="!parts.media.length" class="relative z-10 text-sm italic text-muted-foreground">
      Publicação sem conteúdo.
    </p>

    <div v-if="parts.media.length" class="pointer-events-none relative z-10">
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
