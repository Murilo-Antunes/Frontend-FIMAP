<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Check, X } from 'lucide-vue-next'
import type { Badge } from '../types/community.types'
import BadgeIcon from './BadgeIcon.vue'

const props = defineProps<{
  open: boolean
  badges: Badge[]
  selected: number[]
  max: number
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', ids: number[]): void
}>()

const draft = ref<number[]>([])
const dialogRef = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      draft.value = [...props.selected]
      lastFocused = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      dialogRef.value?.focus()
    } else {
      document.body.style.overflow = ''
      lastFocused?.focus?.()
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function close(): void {
  emit('update:open', false)
}

function isSelected(id: number): boolean {
  return draft.value.includes(id)
}

function isLocked(id: number): boolean {
  return !isSelected(id) && draft.value.length >= props.max
}

function toggle(id: number): void {
  if (isSelected(id)) {
    draft.value = draft.value.filter((current) => current !== id)
  } else if (!isLocked(id)) {
    draft.value = [...draft.value, id]
  }
}

function apply(): void {
  emit('confirm', [...draft.value])
  close()
}

/** Esc fecha; Tab fica preso dentro do diálogo. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !dialogRef.value) return

  const items = Array.from(dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (items.length === 0) return

  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === dialogRef.value)) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      @mousedown.self="close"
    >
      <div
        ref="dialogRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-picker-title"
        tabindex="-1"
        class="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white text-neutral-900 shadow-xl outline-none sm:rounded-2xl"
        @keydown="onKeydown"
      >
        <header class="flex items-start justify-between gap-4 p-5 pb-3">
          <div>
            <h2 id="badge-picker-title" class="text-base font-semibold">Badges em destaque</h2>
            <p class="mt-0.5 text-xs text-neutral-400">
              Escolha até {{ max }} insígnias para o seu cartão público.
              <span class="font-medium text-neutral-900">{{ draft.length }} de {{ max }}</span>
            </p>
          </div>
          <button
            type="button"
            class="rounded-full p-1.5 text-neutral-400 transition hover:bg-[#f3f3f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            aria-label="Fechar"
            @click="close"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </header>

        <ul class="flex-1 space-y-2 overflow-y-auto px-5 pb-2">
          <li v-for="badge in badges" :key="badge.id">
            <label
              class="flex cursor-pointer items-center gap-3 rounded-xl bg-[#f3f3f3] p-3 transition hover:bg-[#ececec] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-black/30"
              :class="{ 'cursor-not-allowed opacity-50': isLocked(badge.id) }"
            >
              <input
                type="checkbox"
                class="sr-only"
                :checked="isSelected(badge.id)"
                :disabled="isLocked(badge.id)"
                @change="toggle(badge.id)"
              />
              <BadgeIcon :icone="badge.icone" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ badge.nome }}</span>
                <span class="block truncate text-xs text-neutral-400">{{ badge.descricao }}</span>
              </span>
              <span
                class="flex size-5 shrink-0 items-center justify-center rounded-md border"
                :class="isSelected(badge.id) ? 'border-black bg-black text-white' : 'border-neutral-300 bg-white'"
                aria-hidden="true"
              >
                <Check v-if="isSelected(badge.id)" class="size-3.5" />
              </span>
            </label>
          </li>
        </ul>

        <footer class="flex justify-end gap-2 p-5 pt-3">
          <button
            type="button"
            class="h-10 rounded-full bg-[#ebebeb] px-5 text-sm font-medium text-neutral-900 transition hover:bg-[#e2e2e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            @click="close"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="h-10 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
            @click="apply"
          >
            Aplicar
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
