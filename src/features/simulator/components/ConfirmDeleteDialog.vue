<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  /** Nome da simulação a excluir */
  name: string
  busy: boolean
  error: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

// <dialog> nativo: foco preso, Esc fecha e leitores de tela anunciam como modal.
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    const element = dialog.value
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  },
  { flush: 'post' },
)

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialog.value && !props.busy) emit('cancel')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="m-auto w-[min(92vw,26rem)] rounded-2xl p-0 shadow-2xl backdrop:bg-neutral-950/40"
    aria-labelledby="delete-dialog-title"
    @cancel.prevent="!busy && emit('cancel')"
    @click="onBackdropClick"
  >
    <div class="p-6">
      <h2 id="delete-dialog-title" class="text-lg font-semibold text-neutral-950">
        Excluir simulação?
      </h2>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">
        “{{ name }}” será removida permanentemente do seu histórico. Essa ação não pode ser desfeita.
      </p>
      <p v-if="error" role="alert" class="mt-3 text-sm text-red-600">{{ error }}</p>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          :disabled="busy"
          class="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="busy"
          class="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
          @click="emit('confirm')"
        >
          {{ busy ? 'Excluindo…' : 'Excluir' }}
        </button>
      </div>
    </div>
  </dialog>
</template>
