<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowLeft, Loader2, SquarePen } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useSocialProfileStore } from '@/stores/social-profile.store'
import { toApiError } from '@/lib/api/types/api-error'
import { postService } from '../services/post.service'
import type { Post } from '../types/community.types'
import UserAvatar from './UserAvatar.vue'

const MAX_LENGTH = 2000

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created', post: Post): void
}>()

const auth = useAuthStore()
const social = useSocialProfileStore()

const text = ref('')
const sending = ref(false)
const errorMessage = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

const perfil = computed(() => social.perfil)
const canSubmit = computed(() => text.value.trim().length > 0 && !sending.value)

function close(): void {
  if (sending.value) return
  emit('update:open', false)
}

function autoGrow(): void {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, 240)}px`
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    text.value = ''
    errorMessage.value = ''
    await nextTick()
    autoGrow()
    textareaRef.value?.focus()
  },
)

watch(text, () => void nextTick(autoGrow))

async function submit(): Promise<void> {
  if (!canSubmit.value) return
  sending.value = true
  errorMessage.value = ''

  try {
    const idUsuario = auth.usuario?.id??0
    const created = await postService.create(idUsuario, text.value.trim())

    // Se o backend não embutir autor/contagens, completa com o perfil social do usuário.
    const post: Post = {
      ...created,
      conteudo: created.conteudo ?? [{ tipo: 'texto', valor: text.value.trim() }],
      id_usuario: created.id_usuario ?? idUsuario,
      autor: created.autor ?? {
        id: idUsuario,
        nome_exibicao: perfil.value?.nome_exibicao ?? null,
        username_social: perfil.value?.username_social ?? null,
        foto_perfil: perfil.value?.foto_perfil ?? null,
      },
      total_curtidas: created.total_curtidas ?? 0,
      total_comentarios: created.total_comentarios ?? 0,
      curtiu: created.curtiu ?? false,
    }

    emit('created', post)
    sending.value = false
    emit('update:open', false)
  } catch (error) {
    errorMessage.value = toApiError(error).mensagem
    sending.value = false
  }
}

const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled])'

/** Esc fecha; Ctrl/Cmd+Enter posta; Tab fica preso no diálogo. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    void submit()
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return

  const items = Array.from(dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center bg-white/40 px-4 pt-20 backdrop-blur-md sm:pt-24"
      @mousedown.self="close"
    >
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-post-title"
        class="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05),0_18px_50px_rgba(0,0,0,0.12)]"
        @keydown="onKeydown"
      >
        <h2 id="new-post-title" class="sr-only">Novo post</h2>

        <div class="px-5 pt-4 sm:px-6">
          <button
            type="button"
            aria-label="Voltar"
            class="-ml-2 rounded-full p-2 text-neutral-900 transition hover:bg-[#f3f3f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            @click="close"
          >
            <ArrowLeft class="size-5" aria-hidden="true" />
          </button>
        </div>

        <div class="flex gap-4 px-5 pb-4 pt-3 sm:px-6">
          <UserAvatar :src="perfil?.foto_perfil" :name="perfil?.nome_exibicao" size="lg" />
          <div class="min-w-0 flex-1">
            <label for="new-post-text" class="sr-only">Conteúdo do post</label>
            <textarea
              id="new-post-text"
              ref="textareaRef"
              v-model="text"
              :maxlength="MAX_LENGTH"
              :disabled="sending"
              placeholder="O que está acontecendo?"
              class="min-h-[240px] w-full resize-none bg-transparent pt-2 text-xl text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-60"
              @input="autoGrow"
            />
          </div>
        </div>

        <p v-if="errorMessage" role="alert" class="px-6 pb-3 text-sm text-red-600">{{ errorMessage }}</p>

        <footer class="flex items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3 sm:px-6">
          <span
            class="text-xs tabular-nums"
            :class="text.length >= MAX_LENGTH - 100 ? 'text-red-500' : 'text-neutral-400'"
            aria-live="polite"
          >
            {{ text.length }}/{{ MAX_LENGTH }}
          </span>
          <button
            type="button"
            :disabled="!canSubmit"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
            @click="submit"
          >
            <Loader2 v-if="sending" class="size-4 animate-spin" aria-hidden="true" />
            <SquarePen v-else class="size-4" aria-hidden="true" />
            postar
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
