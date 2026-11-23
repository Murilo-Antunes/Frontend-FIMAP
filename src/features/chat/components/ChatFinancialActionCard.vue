<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { ArrowUpRight, Check, ChevronDown, Landmark, MessageSquare, Target, TrendingUp } from 'lucide-vue-next'
import FormAlert from '@/components/shared/FormAlert.vue'
import type { FinancialAction } from '../schemas/financial-action.schemas'
import { buildFinancialActionPreview, describeFinancialAction } from '../services/financial-action-preview'

const ChartPanel = defineAsyncComponent(() => import('@/features/simulator/components/ChartPanel.vue'))

const props = defineProps<{
  action: FinancialAction
  busy: boolean
  disabled: boolean
  error?: string
}>()
const emit = defineEmits<{ confirm: [action: FinancialAction]; adjust: [] }>()

const types = {
  meta: { label: 'Meta financeira', draftTitle: 'Nova meta', icon: Target },
  investimento: { label: 'Simulação de investimento', draftTitle: 'Nova simulação', icon: TrendingUp },
  amortizacao: { label: 'Simulação de amortização', draftTitle: 'Nova simulação', icon: Landmark },
}
const type = computed(() => types[props.action.tipo])
const title = computed(() => props.action.nome ?? type.value.draftTitle)
const projection = computed(() => buildFinancialActionPreview(props.action))
const details = computed(() => describeFinancialAction(props.action))
const isGoal = computed(() => props.action.tipo === 'meta')
const statusLabel = computed(() => {
  if (props.action.status === 'salva') return 'Salva na sua conta'
  return props.action.status === 'pronta' ? 'Para revisar' : 'Em preparação'
})
const recordRoute = computed(() => {
  const { tipo, status, id_registro } = props.action
  if (status !== 'salva' || id_registro === undefined) return
  const id = String(id_registro)
  return tipo === 'meta' ? { name: 'metas-editar', params: { id } } : {
    name: 'simulator-edit',
    params: { id, tipo: tipo === 'investimento' ? 'investimentos' : 'amortizacoes' },
  }
})
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm" :aria-label="`${type.label} — ${title}`">
    <div class="proposal-content space-y-3 p-3.5 sm:p-4">
      <header>
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div class="flex min-w-0 items-center gap-2.5 text-sm font-medium text-indigo-900">
            <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-50" aria-hidden="true">
              <component :is="type.icon" :size="17" />
            </span>
            {{ type.label }}
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-medium" role="status"
            :class="action.status === 'salva' ? 'text-emerald-800' : 'text-neutral-600'">
            <Check v-if="action.status === 'salva'" :size="14" aria-hidden="true" />
            {{ statusLabel }}
          </span>
        </div>
        <h3 class="mt-2.5 text-xl leading-tight font-semibold tracking-tight wrap-anywhere text-neutral-950">{{ title }}</h3>
        <p v-if="action.descricao" class="mt-1 text-sm leading-relaxed wrap-anywhere text-neutral-600">{{ action.descricao }}</p>
        <dl v-if="details.terms.length" class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <div v-for="[label, value] in details.terms" :key="label" class="flex flex-wrap items-baseline gap-x-1.5">
            <dt class="text-neutral-600">{{ label }}</dt>
            <dd class="font-semibold text-neutral-900 tabular-nums">{{ value }}</dd>
          </div>
        </dl>
      </header>

      <div v-if="action.status === 'rascunho'" class="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
        <p class="font-medium">Para completar a proposta</p>
        <ul v-if="action.pendencias.length" class="mt-1 list-disc space-y-1 pl-5 leading-relaxed">
          <li v-for="(question, index) in action.pendencias" :key="index" class="wrap-anywhere">{{ question }}</li>
        </ul>
        <p v-else class="mt-1 leading-relaxed">
          {{ action.nome ? 'Continue no chat para completar os dados.' : 'Qual nome você quer dar a esta proposta?' }}
        </p>
      </div>

      <template v-if="projection">
        <dl class="projection-metrics overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200">
          <div v-for="(metric, index) in projection.metrics" :key="metric.label" class="min-w-0 bg-white p-2.5 sm:p-3"
            :class="{ 'projection-primary': index === 0 }">
            <dt class="text-xs text-neutral-600">{{ metric.label }}</dt>
            <dd class="mt-1 text-base leading-tight font-semibold tracking-tight tabular-nums wrap-anywhere sm:text-lg"
              :class="metric.attention ? 'text-amber-800' : 'text-neutral-950'">{{ metric.value }}</dd>
          </div>
        </dl>

        <figure class="rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2.5 sm:px-3">
          <figcaption class="px-1.5 sm:px-2">
            <p class="text-sm font-semibold text-neutral-900">{{ projection.heading }}</p>
            <ul class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600" aria-label="Séries do gráfico">
              <li v-for="(label, index) in projection.labels" :key="label" class="flex items-center gap-1.5">
                <span class="w-4 border-t-2" :class="index === 0 ? 'border-indigo-700' : 'border-dashed border-neutral-500'" aria-hidden="true" />
                {{ label }}
              </li>
            </ul>
          </figcaption>
          <div class="mt-1 min-h-[156px] min-w-0">
            <ChartPanel type="area" :height="156" :options="projection.options" :series="projection.series" :summary="projection.summary" />
          </div>
          <p class="px-1.5 text-xs leading-relaxed text-neutral-600 sm:px-2">{{ projection.note }}</p>
        </figure>
      </template>

      <details v-if="details.fields.length || action.justificativa || action.premissas.length" class="group rounded-xl border border-neutral-200">
        <summary class="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
          Dados e premissas
          <ChevronDown :size="16" class="shrink-0 text-neutral-500 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div class="space-y-3 border-t border-neutral-200 px-3 py-3 text-sm text-neutral-700">
          <p v-if="action.justificativa" class="leading-relaxed wrap-anywhere">{{ action.justificativa }}</p>
          <dl v-if="details.fields.length" class="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
            <div v-for="[label, value] in details.fields" :key="label">
              <dt class="text-xs text-neutral-600">{{ label }}</dt>
              <dd class="mt-0.5 font-medium wrap-anywhere text-neutral-900 tabular-nums">{{ value }}</dd>
            </div>
          </dl>
          <ul v-if="action.premissas.length" class="list-disc space-y-1 pl-5 text-xs leading-relaxed">
            <li v-for="(assumption, index) in action.premissas" :key="index" class="wrap-anywhere">{{ assumption }}</li>
          </ul>
        </div>
      </details>

      <FormAlert v-if="error">{{ error }}</FormAlert>
    </div>

    <footer class="flex flex-wrap justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-3.5 py-2.5 sm:px-4">
      <RouterLink v-if="recordRoute" :to="recordRoute" class="action-link">
        {{ isGoal ? 'Ver meta' : 'Ver simulação' }} <ArrowUpRight :size="16" aria-hidden="true" />
      </RouterLink>
      <template v-else>
        <button type="button" class="action-link" :disabled="disabled" @click="emit('adjust')">
          <MessageSquare :size="15" aria-hidden="true" />
          {{ action.status === 'rascunho' ? 'Responder no chat' : 'Pedir ajuste' }}
        </button>
        <button v-if="action.status === 'pronta'" type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-45"
          :disabled="disabled" :aria-busy="busy" @click="emit('confirm', action)">
          {{ busy ? 'Salvando…' : isGoal ? 'Salvar meta' : 'Salvar simulação' }}
        </button>
      </template>
    </footer>
  </section>
</template>

<style scoped>
.proposal-content { container-type: inline-size; }
.projection-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
}
.projection-primary { grid-column: span 2; }
@container (min-width: 370px) {
  .projection-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .projection-primary { grid-column: span 1; }
}
.action-link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  color: #3730a3;
  font-size: 0.875rem;
  font-weight: 600;
}
.action-link:not(:disabled):hover { background: #eef2ff; }
.action-link:disabled { opacity: 0.45; }
button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
summary::-webkit-details-marker { display: none; }
</style>
