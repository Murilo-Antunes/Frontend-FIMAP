<script setup lang="ts">
import { ArrowRight, Bookmark, LoaderCircle } from 'lucide-vue-next'
import type { SaveFeedback } from '../composables/useSimulationSave'

defineProps<{
  /** Texto do botão principal (criar meta a partir da simulação) */
  primaryLabel: string
  /** Desabilita o botão principal quando ainda não há resultado válido para virar meta */
  primaryDisabled?: boolean
  /** true = simulação já existente → "Salvar Alteração" (PATCH); false → "Salvar Simulação" (POST) */
  editing: boolean
  saving: boolean
  /** Em edição, só habilita salvar quando algo mudou */
  canSave: boolean
  feedback: SaveFeedback | null
}>()

defineEmits<{ save: []; primary: [] }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <button
      type="button"
      :disabled="primaryDisabled"
      class="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="$emit('primary')"
    >
      {{ primaryLabel }}
      <ArrowRight class="size-4" aria-hidden="true" />
    </button>

    <button
      type="button"
      :disabled="saving || !canSave"
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
      @click="$emit('save')"
    >
      {{ editing ? 'Salvar Alteração' : 'Salvar Simulação' }}
      <LoaderCircle v-if="saving" class="size-4 animate-spin" aria-hidden="true" />
      <Bookmark v-else class="size-4" aria-hidden="true" />
    </button>

    <p
      role="status"
      class="min-h-5 text-center text-xs"
      :class="feedback?.tone === 'error' ? 'text-red-600' : 'text-emerald-600'"
    >
      {{ feedback?.message }}
    </p>
  </div>
</template>
