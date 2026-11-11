<script setup lang="ts">
import { History, Loader2 } from 'lucide-vue-next'
import type { LoanPaidSummary } from '../types/loans.types'
import { formatCurrencyBRL } from '../services/loans.mapper'

defineProps<{
  resumo: LoanPaidSummary
  carregando?: boolean
}>()

const emit = defineEmits<{ (e: 'carregar-mais'): void }>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
    <div class="flex items-center gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <History class="h-4 w-4" />
      </div>
      <div>
        <p class="text-sm font-medium text-neutral-900">
          Parcelas {{ String(resumo.numeroInicial).padStart(2, '0') }} a {{ String(resumo.numeroFinal).padStart(2, '0') }}
        </p>
        <p class="text-xs text-neutral-500">Total acumulado: {{ formatCurrencyBRL(resumo.valorTotal) }}</p>
      </div>
    </div>
    <button
      type="button"
      class="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-900 disabled:opacity-50"
      :disabled="carregando"
      @click="emit('carregar-mais')"
    >
      <Loader2 v-if="carregando" class="h-4 w-4 animate-spin" />
      {{ carregando ? 'Carregando…' : `Mostrar mais (${resumo.quantidade})` }}
    </button>
  </div>
</template>