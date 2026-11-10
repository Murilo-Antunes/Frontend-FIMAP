<script setup lang="ts">
import { rotuloMes } from '../utils/statement'

defineProps<{ meses: string[]; ativo: string | null }>()
const emit = defineEmits<{ selecionar: [mes: string] }>()
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Período do extrato">
    <button
      v-for="mes in meses"
      :key="mes"
      type="button"
      class="shrink-0 rounded-full border px-5 py-2 text-xs font-medium transition"
      :class="
        mes === ativo
          ? 'border-neutral-950 bg-neutral-950 text-white'
          : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
      "
      :aria-pressed="mes === ativo"
      @click="emit('selecionar', mes)"
    >
      {{ rotuloMes(mes) }}
    </button>
  </div>
</template>
