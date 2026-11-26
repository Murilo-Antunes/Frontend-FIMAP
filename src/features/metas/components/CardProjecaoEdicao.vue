<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatarMoeda } from '../utils/metas.utils'

const props = defineProps<{
  aporteMensal: number
  mesesProjetados: number
  rotuloTaxa?: string
}>()

const emit = defineEmits<{ 'update:aporteMensal': [value: number] }>()
const simulando = ref(false)
const aporteInput = ref(props.aporteMensal)
const aporteFormatado = computed(() => formatarMoeda(props.aporteMensal))

watch(() => props.aporteMensal, (value) => { aporteInput.value = value })
</script>

<template>
  <div class="rounded-2xl bg-black p-5 text-white">
    <div class="mb-3 flex items-center justify-between">
      <span class="text-xs font-medium tracking-wide text-gray-300">PROJEÇÃO FIMAP</span>
      <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium">
        {{ rotuloTaxa ?? 'CDI Estável' }}
      </span>
    </div>

    <p class="text-sm leading-relaxed text-gray-200">
      Com um aporte mensal de <span class="font-semibold">{{ aporteFormatado }}</span>,
      você alcançará sua meta em aproximadamente
      <span class="underline underline-offset-2">{{ mesesProjetados }} {{ mesesProjetados === 1 ? 'mês' : 'meses' }}</span>.
    </p>

    <label v-if="simulando" class="mt-4 block text-xs text-gray-300">
      Novo aporte mensal (R$)
      <input
        v-model.number="aporteInput"
        type="number"
        min="0"
        step="0.01"
        class="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white"
        @input="emit('update:aporteMensal', Math.max(0, Number(aporteInput) || 0))"
      />
    </label>

    <button
      type="button"
      class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-black hover:bg-gray-100"
      :aria-expanded="simulando"
      @click="simulando = !simulando"
    >
      {{ simulando ? 'Fechar simulação' : 'Simular novo aporte' }}
    </button>
  </div>
</template>
