<script setup lang="ts">
import { computed } from 'vue'
import { ChartLine, Percent, Sparkles, TrendingDown } from 'lucide-vue-next'
import SimCard from './SimCard.vue'
import ChartPanel from './ChartPanel.vue'
import { buildAmortizationChart } from '../lib/chart-options'
import { formatBRL, formatBRLInt, formatDuration, formatPercent } from '../lib/format'
import type { AmortizationResult, CalcSystem } from '../types/simulator.types'

const props = defineProps<{
  result: AmortizationResult | null
  sistema: CalcSystem
  extraMensal: number
}>()

const chart = computed(() =>
  props.result
    ? buildAmortizationChart(
        props.result.serie,
        props.result.mesesEconomizados > 0 ? props.result.quitacaoAno : null,
      )
    : null,
)

const horizonYears = computed(() => (props.result ? Math.ceil(props.result.mesesOriginal / 12) : 0))
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Economia total -->
    <section class="rounded-3xl bg-neutral-950 p-7 text-white" aria-labelledby="amo-total-title">
      <div class="flex items-center justify-between gap-4">
        <h2
          id="amo-total-title"
          class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        >
          <Sparkles class="size-4" aria-hidden="true" />
          Inteligência Amortizadora
        </h2>
        <span class="text-xs text-neutral-400">Projeção {{ sistema }} Real</span>
      </div>

      <p class="mt-6 text-[11px] uppercase tracking-wider text-neutral-400">Economia total estimada</p>
      <p class="mt-1 text-4xl font-bold tracking-tight tabular-nums" aria-live="polite">
        {{ result ? formatBRL(result.economia) : '—' }}
      </p>
      <p class="mt-2 text-xs text-neutral-400">Poupança direta em juros bancários futuros evitados.</p>

      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl bg-white/5 p-4">
          <p class="text-xs text-neutral-400">Tempo de Financiamento</p>
          <p class="mt-2 flex items-baseline gap-2 tabular-nums">
            <span class="text-3xl font-bold">{{ result ? `${result.meses}m` : '—' }}</span>
            <span
              v-if="result && result.mesesEconomizados > 0"
              class="text-sm text-neutral-500 line-through"
            >
              {{ result.mesesOriginal }}m
            </span>
          </p>
          <p
            v-if="result"
            class="mt-2 inline-block rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300"
          >
            {{
              result.mesesEconomizados > 0
                ? `-${formatDuration(result.mesesEconomizados)}`
                : 'Prazo mantido'
            }}
          </p>
        </div>

        <div class="rounded-2xl bg-white/5 p-4">
          <p class="text-xs text-neutral-400">Nova Parcela Média</p>
          <p class="mt-2 text-2xl font-bold tabular-nums">
            {{ result ? formatBRL(result.parcelaMedia) : '—' }}
          </p>
          <p v-if="result" class="mt-1.5 text-[11px] text-neutral-400 tabular-nums">
            Antes {{ formatBRL(result.parcelaMediaOriginal) }}
          </p>
          <p class="text-[11px] text-neutral-500">Sem encargos extras</p>
        </div>
      </div>
    </section>

    <!-- Curva de amortização -->
    <SimCard>
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="flex items-center gap-2 text-base font-semibold text-neutral-950">
          <TrendingDown class="size-4" aria-hidden="true" />
          Curva de Amortização
        </h2>
        <span v-if="result" class="text-xs text-neutral-400">Projeção {{ horizonYears }} Anos</span>
      </div>

      <ChartPanel
        v-if="chart && result"
        type="line"
        :options="chart.options"
        :series="chart.series"
        :height="240"
        :summary="`Saldo devedor zera em ${formatDuration(result.meses)} com o aporte, contra ${formatDuration(result.mesesOriginal)} sem amortização.`"
      />
      <p v-else class="grid h-[240px] place-items-center text-sm text-neutral-400">
        Preencha os parâmetros da dívida para ver a projeção.
      </p>

      <ul class="mt-2 flex justify-center gap-6 text-xs text-neutral-500">
        <li class="flex items-center gap-2">
          <span class="size-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
          Com Aporte {{ formatBRLInt(extraMensal) }}
        </li>
        <li class="flex items-center gap-2">
          <span class="h-0 w-4 border-t-2 border-dashed border-neutral-400" aria-hidden="true" />
          Sem Amortização
        </li>
      </ul>
    </SimCard>

    <!-- Indicadores -->
    <div class="grid gap-4 sm:grid-cols-2">
      <SimCard>
        <span class="grid size-8 place-items-center rounded-full bg-neutral-100">
          <Percent class="size-3.5" aria-hidden="true" />
        </span>
        <p class="mt-4 text-3xl font-bold tabular-nums text-neutral-950">
          {{ result ? `-${formatPercent(result.jurosEliminadosPct, 0)}%` : '—' }}
        </p>
        <p class="mt-1 text-sm font-semibold text-neutral-950">Juros Totais Eliminados</p>
        <p class="mt-1 text-xs text-neutral-500">Você não transfere rentabilidade ao credor.</p>
      </SimCard>

      <SimCard>
        <span class="grid size-8 place-items-center rounded-full bg-neutral-100">
          <ChartLine class="size-3.5" aria-hidden="true" />
        </span>
        <p class="mt-4 text-3xl font-bold tabular-nums text-neutral-950">
          {{ result ? formatPercent(result.cetEfetivo, 1) : '—' }}
          <span class="text-xs font-normal text-neutral-400">a.a.</span>
        </p>
        <p class="mt-1 text-sm font-semibold text-neutral-950">Novo CET Efetivo</p>
        <p v-if="result" class="mt-1 text-xs text-neutral-500">
          Reduzido de {{ formatPercent(result.cetEfetivoOriginal, 1) }}% a.a. sem amortização.
        </p>
      </SimCard>
    </div>
  </div>
</template>
