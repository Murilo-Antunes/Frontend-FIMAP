<script setup lang="ts">
import { computed } from 'vue'
import type { CartaoExtrato, FaturaExtrato } from '../types/cards-statement.types'
import { formatarMoeda, rotuloFatura, textoVencimento } from '../utils/statement'

const props = defineProps<{ cartao: CartaoExtrato; fatura: FaturaExtrato }>()

const tipoRotulo = computed(() => (props.cartao.tipo === 'virtual' ? 'Virtual' : 'Físico'))
</script>

<template>
  <section
    class="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white px-6 py-8 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-9"
    aria-label="Resumo do cartão"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <span
        v-if="cartao.instituicao"
        class="rounded bg-neutral-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
      >
        {{ cartao.instituicao }}
      </span>
      <p class="min-w-0 truncate text-base font-semibold text-neutral-900">
        {{ cartao.nome }}<template v-if="cartao.finalNumero"> •••• {{ cartao.finalNumero }}</template>
      </p>
      <span
        class="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500"
      >
        {{ tipoRotulo }}
      </span>
    </div>

    <div class="sm:text-right">
      <p class="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {{ rotuloFatura(fatura.status) }}
      </p>
      <p class="mt-1 text-[32px] font-semibold leading-none tracking-tight text-neutral-950">
        {{ formatarMoeda(fatura.valorTotal) }}
      </p>
      <p class="mt-2 text-xs text-neutral-500">{{ textoVencimento(fatura) }}</p>
    </div>
  </section>
</template>
