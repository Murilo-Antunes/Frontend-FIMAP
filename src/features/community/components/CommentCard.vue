<script setup lang="ts">
import { computed, ref } from 'vue'
import { CornerDownRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { commentService } from '../services/comment.service'
import type { Comentario } from '../types/community.types'
import { authorHandle, authorName, formatFullDate, formatRelativeShort } from '../utils/format'
import LikeButton from './LikeButton.vue'
import UserAvatar from './UserAvatar.vue'

defineOptions({ name: 'CommentCard' })

const props = withDefaults(defineProps<{ comment: Comentario; depth?: number }>(), { depth: 0 })
const emit = defineEmits<{ reply: [comment: Comentario] }>()

const auth = useAuthStore()

const name = computed(() => authorName(props.comment.autor))
const handle = computed(() => authorHandle(props.comment.autor))

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
  <li class="list-none">
    <div class="flex gap-3">
      <UserAvatar :src="comment.autor.foto_perfil" :name="name" :size="depth > 0 ? 'sm' : 'md'" />
      <div class="min-w-0 flex-1">
        <div class="rounded-2xl bg-muted/60 px-4 py-3">
          <p class="truncate text-sm font-semibold leading-tight text-foreground">{{ name }}</p>
          <p class="truncate text-xs text-muted-foreground">
            <span v-if="handle">{{ handle }} · </span>
            <time :datetime="comment.data_criacao" :title="formatFullDate(comment.data_criacao)">
              {{ formatRelativeShort(comment.data_criacao) }}
            </time>
          </p>
          <p class="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground/90">
            {{ comment.mensagem }}
          </p>
        </div>

        <div class="mt-1 flex items-center gap-1 text-muted-foreground">
          <LikeButton :liked="liked" :count="likes" :busy="busy" @toggle="toggleLike" />
          <button
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @click="emit('reply', comment)"
          >
            <CornerDownRight class="size-4" aria-hidden="true" />
            Responder
          </button>
        </div>

        <ul v-if="comment.respostas.length" class="mt-3 space-y-4 border-l border-border/60 pl-4">
          <CommentCard
            v-for="reply in comment.respostas"
            :key="reply.id"
            :comment="reply"
            :depth="depth + 1"
            @reply="emit('reply', $event)"
          />
        </ul>
      </div>
    </div>
  </li>
</template>
