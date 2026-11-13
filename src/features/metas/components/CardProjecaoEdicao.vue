<script setup lang="ts">
import { Sparkles, Wand2 } from 'lucide-vue-next'

defineProps<{
  mesesAntecipados: number
  rotuloTaxa?: string
}>()

const emit = defineEmits<{
  simular: []
}>()
</script>

<template>
  <div class="rounded-2xl bg-black text-white p-5 flex flex-col">
    <div class="flex items-center justify-between mb-3">
      <span class="flex items-center gap-2 text-xs font-medium tracking-wide text-gray-300">
        <Sparkles class="h-4 w-4" />
        PROJEÇÃO FIMAP AI
      </span>
      <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
        {{ rotuloTaxa ?? 'CDI Estável' }}
      </span>
    </div>

    <p class="text-sm text-gray-200 leading-relaxed">
      Com os ajustes atuais, você antecipará sua meta em
      <span class="underline underline-offset-2">{{ mesesAntecipados }} meses</span>
      em relação ao plano inicial.
    </p>

    <svg viewBox="0 0 300 70" class="mt-4 h-16 w-full" preserveAspectRatio="none">
      <polyline
        points="0,62 60,55 120,45 180,28 240,12 300,4"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <button
      type="button"
      class="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black hover:bg-gray-100"
      @click="emit('simular')"
    >
      <Wand2 class="h-4 w-4" />
      Simular Novo Aporte com IA
    </button>
  </div>
</template>
