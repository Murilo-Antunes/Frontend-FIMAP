<script setup lang="ts">
import { ClipboardList } from 'lucide-vue-next'
import type { Loan } from '../types/loans.types'
import { formatCurrencyBRL, formatDateBR } from '../services/loans.mapper'

defineProps<{ loan: Loan }>()
</script>

<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-6">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Saldo devedor restante</p>
        <p class="mt-2 text-3xl font-semibold text-neutral-900">{{ formatCurrencyBRL(loan.saldoDevedor) }}</p>
        <p class="mt-1 text-sm text-neutral-400">de {{ formatCurrencyBRL(loan.valorContratado) }} original contratado</p>
      </div>
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        <ClipboardList class="h-4 w-4" />
      </div>
    </div>

    <div class="mt-6">
      <div class="mb-2 flex items-center justify-between text-sm">
        <span class="text-neutral-500">Progresso de Quitação</span>
        <span class="font-medium text-neutral-900">
          {{ loan.progresso }}% ({{ loan.parcelasPagas }}/{{ loan.totalParcelas }})
        </span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div class="h-full rounded-full bg-neutral-900" :style="{ width: `${loan.progresso}%` }" />
      </div>
      <div class="mt-2 flex justify-between text-xs text-neutral-500">
        <span>{{ loan.parcelasPagas }} parcelas pagas</span>
        <span>{{ loan.parcelasRestantes }} restantes</span>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5">
      <div>
        <p class="text-xs text-neutral-500">Parcela</p>
        <p class="mt-1 text-sm font-semibold text-neutral-900">{{ formatCurrencyBRL(loan.parcelaMensal) }}</p>
      </div>
      <div>
        <p class="text-xs text-neutral-500">Taxa</p>
        <p class="mt-1 text-sm font-semibold text-neutral-900">
          {{ loan.taxaJurosMensal !== null ? `${loan.taxaJurosMensal.toLocaleString('pt-BR')}% a.m.` : '—' }}
        </p>
      </div>
      <div>
        <p class="text-xs text-neutral-500">Próx. Venc.</p>
        <p class="mt-1 text-sm font-semibold text-neutral-900">
          {{ loan.proximoVencimento ? formatDateBR(loan.proximoVencimento) : '—' }}
        </p>
      </div>
    </div>
  </div>
</template>
