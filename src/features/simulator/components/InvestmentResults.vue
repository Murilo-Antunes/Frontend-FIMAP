<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, TrendingUp } from 'lucide-vue-next'
import SimCard from './SimCard.vue'
import ChartPanel from './ChartPanel.vue'
import { buildGrowthChart } from '../lib/chart-options'
import { formatBRL, formatPercent } from '../lib/format'
import type { InvestmentResult } from '../types/simulator.types'

const props = defineProps<{
  result: InvestmentResult | null
  /** Indicadores de mercado (poupança/IPCA) ainda carregando */
  marketLoading: boolean
}>()

const split = computed(() => {
  const result = props.result
  if (!result || result.total <= 0) return { aportes: 0, juros: 0 }
  const aportes = Math.min(100, Math.max(0, (result.aportes / result.total) * 100))
  return { aportes, juros: 100 - aportes }
})

const chart = computed(() => (props.result ? buildGrowthChart(props.result.serie) : null))

const savingsText = computed(() => {
  const gain = props.result?.ganhoSobrePoupanca
  if (gain === null || gain === undefined) return null
  return { gain: formatBRL(Math.abs(gain)), more: gain >= 0 }
})

const realText = computed(() => {
  const real = props.result?.rentabilidadeReal
  if (real === null || real === undefined) return null
  return { value: formatPercent(Math.abs(real), 1), above: real >= 0 }
})

const marketFallback = computed(() =>
  props.marketLoading
    ? 'Carregando indicadores de mercado…'
    : 'Indicadores de mercado indisponíveis no momento.',
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Total acumulado -->
    <section class="rounded-3xl bg-neutral-950 p-7 text-white" aria-labelledby="inv-total-title">
      <div class="flex items-start justify-between gap-4">
        <h2
          id="inv-total-title"
          class="text-[11px] font-semibold uppercase tracking-wider text-neutral-300"
        >
          Total acumulado estimado
        </h2>
        <span class="rounded-full border border-white/20 px-3 py-1 text-xs text-neutral-200">
          Inteligência Composta
        </span>
      </div>

      <p class="mt-4 text-5xl font-bold tracking-tight tabular-nums" aria-live="polite">
        {{ result ? formatBRL(result.total) : '—' }}
      </p>
      <p class="mt-2 text-xs text-neutral-400">Projeção bruta com aportes mensais consistentes</p>

      <div class="mt-6 flex h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div class="h-full bg-white transition-[width]" :style="{ width: `${split.aportes}%` }" />
        <div
          class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width]"
          :style="{ width: `${split.juros}%` }"
        />
      </div>

      <dl v-if="result" class="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-xs text-neutral-300">
        <div class="flex items-center gap-2">
          <span class="size-2.5 rounded-full bg-white" aria-hidden="true" />
          <dt>Aportes:</dt>
          <dd class="font-semibold text-white tabular-nums">
            {{ formatBRL(result.aportes) }}
            <span class="font-normal text-neutral-400">({{ formatPercent(split.aportes, 0) }}%)</span>
          </dd>
        </div>
        <div class="flex items-center gap-2">
          <span class="size-2.5 rounded-full bg-indigo-400" aria-hidden="true" />
          <dt>Juros:</dt>
          <dd class="font-semibold text-indigo-300 tabular-nums">
            +{{ formatBRL(result.juros) }}
            <span class="font-normal text-neutral-400">({{ formatPercent(split.juros, 0) }}%)</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Curva de aceleração -->
    <SimCard>
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-neutral-950">Curva de Aceleração</h2>
          <p class="mt-1 text-xs text-neutral-500">Evolução do patrimônio investido vs. juros auferidos</p>
        </div>
        <span class="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <TrendingUp class="size-4" aria-hidden="true" />
        </span>
      </div>

      <ChartPanel
        v-if="chart && result"
        type="area"
        :options="chart.options"
        :series="chart.series"
        :summary="`Patrimônio estimado de ${formatBRL(result.total)} ao final do prazo, sendo ${formatBRL(result.aportes)} em aportes e ${formatBRL(result.juros)} em juros.`"
      />
      <p v-else class="grid h-[280px] place-items-center text-sm text-neutral-400">
        Preencha os parâmetros para ver a projeção.
      </p>
    </SimCard>

    <!-- Eficiência do capital -->
    <SimCard eyebrow="Eficiência do capital">
      <div class="grid gap-4 sm:grid-cols-2">
        <article class="flex gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white"
          >
            <TrendingUp class="size-5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-neutral-950">Comparativo com a Poupança</h3>
            <p v-if="savingsText" class="mt-1 text-xs leading-relaxed text-neutral-600">
              Você acumula
              <strong class="text-neutral-950">{{ savingsText.more ? '+' : '−' }}{{ savingsText.gain }}</strong>
              a {{ savingsText.more ? 'mais' : 'menos' }} do que na caderneta tradicional.
            </p>
            <p v-else class="mt-1 text-xs text-neutral-500">{{ marketFallback }}</p>
          </div>
        </article>

        <article class="flex gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white text-indigo-600"
          >
            <ShieldCheck class="size-5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-neutral-950">Poder de Compra Protegido</h3>
            <p v-if="realText" class="mt-1 text-xs leading-relaxed text-neutral-600">
              Ganho real estimado {{ realText.above ? 'acima' : 'abaixo' }} da inflação de
              <strong class="text-neutral-950">{{ realText.above ? '+' : '−' }}{{ realText.value }}% a.a.</strong>
              frente ao IPCA projetado.
            </p>
            <p v-else class="mt-1 text-xs text-neutral-500">{{ marketFallback }}</p>
          </div>
        </article>
      </div>
    </SimCard>
  </div>
</template>
