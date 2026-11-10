<script setup lang="ts">
import { computed } from 'vue'
import type { FaturaCartao, StatusRecurso } from '../types/cards.types'
import { formatarMoeda, formatarVencimento, percentual } from '../utils/format'
import CardsErrorState from './CardsErrorState.vue'

const props = defineProps<{
  fatura: FaturaCartao | null
  status: StatusRecurso
  erro: string | null
}>()

defineEmits<{ tentar: [] }>()

const carregando = computed(
  () => props.status === 'idle' || props.status === 'carregando' || props.status === 'sincronizando',
)

// O backend pode não ter os dados de limite (null): a barra só aparece com eles.
const temLimite = computed(
  () => props.fatura !== null && props.fatura.limiteTotal !== null && props.fatura.limiteUtilizado !== null,
)
const usoPercentual = computed(() =>
  temLimite.value && props.fatura
    ? percentual(props.fatura.limiteUtilizado ?? 0, props.fatura.limiteTotal ?? 0)
    : 0,
)
</script>

<template>
  <section class="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]" aria-label="Fatura atual">
    <div v-if="carregando" aria-busy="true">
      <div class="animate-pulse space-y-4">
        <div class="flex justify-between">
          <div class="space-y-2">
            <div class="h-3 w-20 rounded bg-neutral-100" />
            <div class="h-9 w-44 rounded bg-neutral-100" />
          </div>
          <div class="h-8 w-28 rounded-full bg-neutral-100" />
        </div>
        <div class="h-2 w-full rounded-full bg-neutral-100" />
      </div>
      <p v-if="status === 'sincronizando'" class="mt-3 text-xs text-neutral-400" role="status">
        Sincronizando com o banco…
      </p>
    </div>

    <CardsErrorState v-else-if="status === 'erro'" compacto :mensagem="erro" @tentar="$emit('tentar')" />

    <p v-else-if="!fatura" class="py-6 text-center text-sm text-neutral-500">
      Não há dados de fatura para este cartão.
    </p>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Fatura {{ fatura.status === 'FECHADA' ? 'fechada' : 'atual' }}
          </p>
          <p class="mt-1 text-4xl font-semibold tracking-tight text-neutral-900">
            {{ formatarMoeda(fatura.valorFatura) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-neutral-500">Vencimento</p>
          <p class="mt-1 inline-block rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-800">
            {{ formatarVencimento(fatura.vencimento) }}
          </p>
        </div>
      </div>

      <template v-if="temLimite">
        <div class="mt-5 flex items-center justify-between gap-4 text-xs text-neutral-500">
          <span>
            Usado: {{ formatarMoeda(fatura.limiteUtilizado ?? 0) }} ({{ Math.round(usoPercentual) }}%)
          </span>
          <span v-if="fatura.limiteDisponivel !== null">
            Disponível: {{ formatarMoeda(fatura.limiteDisponivel) }}
          </span>
        </div>

        <div
          class="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"
          role="progressbar"
          aria-label="Limite utilizado"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(usoPercentual)"
        >
          <div
            class="h-full rounded-full bg-neutral-950 transition-[width] duration-700 ease-out"
            :style="{ width: `${usoPercentual}%` }"
          />
        </div>

        <p v-if="fatura.limiteTotal !== null" class="mt-2 text-right text-xs text-neutral-400">
          Limite total: {{ formatarMoeda(fatura.limiteTotal) }}
        </p>
      </template>
    </template>
  </section>
</template>
