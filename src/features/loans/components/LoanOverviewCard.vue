<script setup lang="ts">
import dayjs from 'dayjs'
import { CalendarDays, CreditCard, Wallet } from 'lucide-vue-next'
import type { Loan } from '../types/loans.types'
import { formatCurrencyBRL } from '../services/loans.mapper'

defineProps<{ loan: Loan }>()

// Assume que `dayjs.locale('pt-br')` já está configurado globalmente no projeto
// (necessário para o nome do mês em "Próximo vencimento" sair em português).
</script>

<template>
  <div class="rounded-2xl border border-neutral-200 bg-white p-6">
    <div class="mb-1 flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        <CreditCard class="h-4 w-4" />
        Saldo devedor total
      </div>
      <span class="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
        <span class="h-1.5 w-1.5 rounded-full bg-neutral-900" />
        {{ loan.tipoLabel }}
      </span>
    </div>

    <p class="mt-2 flex items-baseline gap-2">
      <span class="text-3xl font-semibold text-neutral-900">{{ formatCurrencyBRL(loan.saldoDevedor) }}</span>
      <span class="text-sm text-neutral-400">de {{ formatCurrencyBRL(loan.valorContratado) }}</span>
    </p>

    <div class="mt-5">
      <div class="mb-2 flex items-center justify-between text-sm">
        <span class="text-neutral-500">Progresso de Quitação</span>
        <span class="font-medium text-neutral-900">
          {{ loan.progresso }}% ({{ loan.parcelasPagas }}/{{ loan.totalParcelas }} pagas)
        </span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div class="h-full rounded-full bg-neutral-900" :style="{ width: `${loan.progresso}%` }" />
      </div>
    </div>

    <div class="mt-6 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-5">
      <div class="rounded-xl bg-neutral-50 p-3">
        <p class="flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarDays class="h-3.5 w-3.5" />
          Próximo vencimento
        </p>
        <p class="mt-1 text-sm font-semibold text-neutral-900">
          {{ loan.proximoVencimento ? dayjs(loan.proximoVencimento).format('D [de] MMMM') : '—' }}
        </p>
      </div>
      <div class="rounded-xl bg-neutral-50 p-3">
        <p class="flex items-center gap-1.5 text-xs text-neutral-500">
          <Wallet class="h-3.5 w-3.5" />
          Valor da parcela
        </p>
        <p class="mt-1 text-sm font-semibold text-neutral-900">{{ formatCurrencyBRL(loan.parcelaMensal) }}</p>
      </div>
    </div>
  </div>
</template>
