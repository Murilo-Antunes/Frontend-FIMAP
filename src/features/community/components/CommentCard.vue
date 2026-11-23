<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { commentService } from '../services/comment.service'
import type { Comentario } from '../types/community.types'
import { ui } from '../ui'
import { authorHandle, authorName, formatFullDate, formatRelativeShort } from '../utils/format'
import CommentActionsMenu from './CommentActionsMenu.vue'
import LikeButton from './LikeButton.vue'
import UserAvatar from './UserAvatar.vue'

defineOptions({ name: 'CommentCard' })

const props = withDefaults(defineProps<{ comment: Comentario; depth?: number }>(), { depth: 0 })
const emit = defineEmits<{ reply: [comment: Comentario] }>()

const auth = useAuthStore()

const name = computed(() => authorName(props.comment.autor))
const handle = computed(() => authorHandle(props.comment.autor))
const isRoot = computed(() => props.depth === 0)
const isOwn = computed(() => Number(props.comment.id_usuario) === auth.usuario?.id)

const liked = ref(props.comment.curtiu)
const likes = ref(props.comment.total_curtidas)
const busy = ref(false)

async function toggleLike(): Promise<void> {
  if (busy.value) return
  const previous = { liked: liked.value, likes: likes.value }

  busy.value = true
  liked.value = !previous.liked
  likes.value = Math.max(0, previous.likes + (liked.value ? 1 : -1))

  try {
    const result = await commentService.toggleLike(props.comment.id, auth.usuario?.id??0)
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
  <!-- Comentário raiz = card branco; respostas ficam numa caixa cinza dentro dele. -->
  <li
    class="list-none"
    :class="isRoot ? [ui.card, 'mb-4 break-inside-avoid p-4'] : 'rounded-lg bg-[#f7f7f7] p-3'"
  >
    <div class="flex items-center gap-2.5">
      <RouterLink
        :to="{ name: 'community-public-profile', params: { username: comment.autor.username_social } }"
        class="flex items-center"
      >
        <UserAvatar :src="comment.autor.foto_perfil" :name="name" size="sm" />
      </RouterLink>
      <div class="min-w-0">
        <RouterLink
          :to="{ name: 'community-public-profile', params: { username: comment.autor.username_social } }"
          class="block truncate text-[13px] font-semibold leading-tight text-neutral-900 outline-none focus-visible:underline"
        >
          {{ name }}
        </RouterLink>
        <p class="truncate text-[11px] text-neutral-400">
          <span v-if="handle">{{ handle }} · </span>
          <time :datetime="comment.data_criacao" :title="formatFullDate(comment.data_criacao)">
            {{ formatRelativeShort(comment.data_criacao) }}
          </time>
        </p>
      </div>
      <CommentActionsMenu v-if="!isOwn" :post-id="comment.id_post" />
    </div>

    <p class="mt-2.5 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-700">
      {{ comment.mensagem }}
    </p>

    <div class="mt-2.5 flex items-center gap-4">
      <LikeButton :liked="liked" :count="likes" :busy="busy" @toggle="toggleLike" />
      <button
        type="button"
        class="rounded-md text-xs font-semibold text-neutral-900 outline-none transition hover:opacity-70 focus-visible:ring-2 focus-visible:ring-black/30"
        @click="emit('reply', comment)"
      >
        Responder
      </button>
    </div>

    <ul v-if="comment.respostas.length" class="mt-3 space-y-2">
      <CommentCard
        v-for="reply in comment.respostas"
        :key="reply.id"
        :comment="reply"
        :depth="depth + 1"
        @reply="emit('reply', $event)"
      />
    </ul>
  </li>
</template>
