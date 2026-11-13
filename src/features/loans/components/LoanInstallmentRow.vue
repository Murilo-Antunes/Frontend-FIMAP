<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDownToLine, CheckCircle2, Clock, Smartphone } from 'lucide-vue-next'
import type { LoanInstallment } from '../types/loans.types'
import { formatCurrencyBRL, formatDateBR } from '../services/loans.mapper'

const props = withDefaults(
  defineProps<{
    installment: LoanInstallment
    /** 'card': caixa com borda (grade de Parcelas Pendentes) · 'row': linha de lista (Parcelas Pagas / pré-visualização) */
    variant?: 'card' | 'row'
  }>(),
  { variant: 'row' },
)

const emit = defineEmits<{ (e: 'antecipar'): void }>()

const statusLabel = computed(() => {
  const i = props.installment
  if (i.isProxima) return 'Próxima'
  if (i.status === 'PAGA') return 'Liquidado'
  if (i.status === 'AMORTIZADA') return 'Amortizada'
  if (i.status === 'PENDENTE' && i.numero === i.totalParcelas) return 'Final'
  return null
})

const statusClass = computed(() => {
  const i = props.installment
  if (i.isProxima) return 'bg-amber-100 text-amber-700'
  if (i.status === 'PAGA') return 'bg-emerald-100 text-emerald-700'
  if (i.status === 'AMORTIZADA') return 'bg-sky-100 text-sky-700'
  return 'bg-neutral-100 text-neutral-600'
})

const subtitle = computed(() => {
  const i = props.installment
  if (i.status === 'PAGA') return `Pago em ${formatDateBR(i.dataPagamento!)}`
  if (i.status === 'AMORTIZADA') return `Amortizado em ${i.dataPagamento ? formatDateBR(i.dataPagamento) : '—'}`
  if (i.isProxima) return `Vencimento: ${formatDateBR(i.vencimento)} (em ${i.diasParaVencimento} dias)`
  return `Venc. ${formatDateBR(i.vencimento)}`
})

const footnote = computed(() => {
  const i = props.installment
  if (i.status !== 'PENDENTE') return null
  if (i.numero === i.totalParcelas) return 'Última parcela'
  return 'A vencer'
})
</script>

<template>
  <!-- variante "card": grade de Parcelas Futuras / Pendentes -->
  <div
    v-if="variant === 'card'"
    class="rounded-xl border p-4"
    :class="installment.isProxima ? 'border-neutral-900' : 'border-neutral-200'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-700">
          {{ installment.numero }}
        </div>
        <div>
          <p class="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900">
            Parcela {{ installment.numero }}/{{ installment.totalParcelas }}
            <span v-if="statusLabel" class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="statusClass">
              {{ statusLabel }}
            </span>
          </p>
          <p class="mt-1 text-xs text-neutral-500">{{ subtitle }}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-neutral-900">{{ formatCurrencyBRL(installment.valor) }}</p>
        <button
          v-if="installment.economiaEstimadaAntecipacao"
          type="button"
          class="text-xs font-medium text-neutral-900 underline underline-offset-2"
          @click="emit('antecipar')"
        >
        </button>
        <p v-else class="text-xs text-neutral-400">
          {{ installment.isProxima ? 'Valor integral' : footnote }}
        </p>
      </div>
    </div>

    <p v-if="installment.isProxima" class="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
      <Smartphone class="h-3.5 w-3.5" />
      Débito automático ou Pix
    </p>
    <p v-else-if="installment.economiaEstimadaAntecipacao" class="mt-3 text-xs text-neutral-400">
      Economia est.: {{ formatCurrencyBRL(installment.economiaEstimadaAntecipacao) }}
    </p>
  </div>

  <!-- variante "row": Parcelas Pagas e pré-visualização da tela de Empréstimos -->
  <div v-else class="flex items-center justify-between gap-3 py-3">
    <div class="flex items-center gap-3">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        :class="installment.status === 'PAGA' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'"
      >
        <CheckCircle2 v-if="installment.status === 'PAGA'" class="h-4.5 w-4.5" />
        <ArrowDownToLine v-else-if="installment.status === 'AMORTIZADA'" class="h-4.5 w-4.5" />
        <Clock v-else class="h-4.5 w-4.5" />
      </div>
      <div>
        <p class="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900">
          Parcela {{ installment.numero }}/{{ installment.totalParcelas }}
          <span v-if="statusLabel" class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="statusClass">
            {{ statusLabel }}
          </span>
        </p>
        <p class="mt-0.5 text-xs text-neutral-500">{{ subtitle }}</p>
      </div>
    </div>
    <p class="shrink-0 text-sm font-semibold text-neutral-900">{{ formatCurrencyBRL(installment.valor) }}</p>
  </div>
</template>
