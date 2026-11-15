<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import SimCard from './SimCard.vue'
import SimulationInfoCard from './SimulationInfoCard.vue'
import SimulationActions from './SimulationActions.vue'
import InvestmentResults from './InvestmentResults.vue'
import CurrencyField from './CurrencyField.vue'
import RangeSlider from './RangeSlider.vue'
import StepperField from './StepperField.vue'
import TermPicker from './TermPicker.vue'
import RateSelect from './RateSelect.vue'
import { useMarketIndicators } from '../composables/useMarketIndicators'
import { useSimulationSave } from '../composables/useSimulationSave'
import { calculateInvestment } from '../lib/investment'
import { formatBRLInt, formatPrazoAnosMeses } from '../lib/format'
import { buildRateOptions } from '../lib/rate-options'
import {
  validateInvestment,
  type FieldErrors,
  type InvestmentFormState,
} from '../schemas/simulator.schemas'
import type { InvestmentSimulation, TermOption } from '../types/simulator.types'

const props = defineProps<{ record: InvestmentSimulation | null }>()
const emit = defineEmits<{ saved: [record: InvestmentSimulation] }>()

const TERM_OPTIONS: TermOption[] = [
  { label: '1A', months: 12 },
  { label: '3A', months: 36 },
  { label: '5A', months: 60 },
  { label: '10A', months: 120 },
]

/** Simulação nova: título/descrição vazios e parâmetros nos mínimos da tela. */
const BLANK: InvestmentFormState = {
  nome: '',
  descricao: '',
  valor_inicial: 1000,
  aporte_mensal: 0,
  prazo: 12,
  rentabilidade: null, // preenchida com "100% do CDI" assim que os indicadores chegam
}

const form = reactive<InvestmentFormState>({ ...BLANK })
const errors = ref<FieldErrors>({})
const baseline = ref('')

const serialize = () => JSON.stringify({ ...form })

function fillFrom(record: InvestmentSimulation | null): void {
  Object.assign(
    form,
    record
      ? {
          nome: record.nome,
          descricao: record.descricao ?? '',
          valor_inicial: record.valor_inicial,
          aporte_mensal: record.aporte_mensal,
          prazo: record.prazo,
          rentabilidade: record.rentabilidade,
        }
      : BLANK,
  )
  errors.value = {}
  baseline.value = serialize()
}

watch(() => props.record, fillFrom, { immediate: true })

const { indicators, status: indicatorsStatus } = useMarketIndicators()
const rateOptions = computed(() => (indicators.value ? buildRateOptions(indicators.value) : []))

// Simulação nova: seleciona o primeiro atalho (100% do CDI) quando os indicadores chegam.
watch(rateOptions, (options) => {
  if (props.record === null && form.rentabilidade === null && options.length > 0) {
    form.rentabilidade = options[0].value
    baseline.value = serialize()
  }
})

const result = computed(() =>
  form.rentabilidade === null
    ? null
    : calculateInvestment({
        valorInicial: form.valor_inicial,
        aporteMensal: form.aporte_mensal,
        prazoMeses: form.prazo,
        rentabilidadeAa: form.rentabilidade,
        poupancaAa: indicators.value?.poupanca ?? null,
        ipcaAa: indicators.value?.ipca ?? null,
      }),
)

const { saving, feedback, save, clearFeedback } = useSimulationSave('investimentos')

const editing = computed(() => props.record !== null)
const dirty = computed(() => serialize() !== baseline.value)
const canSave = computed(() => !editing.value || dirty.value)

watch(form, () => {
  if (feedback.value?.tone === 'success') clearFeedback()
})

async function submit(): Promise<void> {
  const validation = validateInvestment(form)
  if (!validation.ok) {
    errors.value = validation.errors
    return
  }
  errors.value = {}
  const saved = await save(validation.payload, props.record?.id ?? null)
  if (saved) emit('saved', saved)
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
    <div class="flex flex-col gap-6">
      <SimulationInfoCard
        v-model:nome="form.nome"
        v-model:descricao="form.descricao"
        nome-placeholder="Ex.: Reserva para entrada do imóvel"
        descricao-placeholder="Por que você escolheu esse investimento? Descreva seu objetivo."
        :nome-error="errors.nome"
        :descricao-error="errors.descricao"
      />

      <SimCard eyebrow="Parâmetros do plano">
        <div class="space-y-7">
          <div>
            <div class="mb-3 flex items-baseline justify-between gap-4">
              <span class="text-xs text-neutral-500">Aporte Inicial</span>
              <CurrencyField
                v-model="form.valor_inicial"
                aria-label="Aporte inicial"
                :invalid="!!errors.valor_inicial"
                class="w-44 bg-transparent text-right text-lg font-bold tabular-nums text-neutral-950 outline-none"
              />
            </div>
            <RangeSlider
              v-model="form.valor_inicial"
              label="Aporte inicial"
              :min="1000"
              :max="100000"
              :step="500"
              :min-label="formatBRLInt(1000)"
              :max-label="formatBRLInt(100000)"
            />
            <p v-if="errors.valor_inicial" class="mt-1.5 text-xs text-red-600">
              {{ errors.valor_inicial }}
            </p>
          </div>

          <div>
            <span class="mb-2 block text-xs text-neutral-500">Aporte Mensal</span>
            <StepperField
              v-model="form.aporte_mensal"
              label="aporte mensal"
              :step="100"
              :invalid="!!errors.aporte_mensal"
            />
            <p v-if="errors.aporte_mensal" class="mt-1.5 text-xs text-red-600">
              {{ errors.aporte_mensal }}
            </p>
          </div>

          <div>
            <div class="mb-3 flex items-baseline justify-between gap-4">
              <span class="text-xs text-neutral-500">Prazo Estimado</span>
              <span class="text-xs font-semibold text-neutral-950">
                {{ formatPrazoAnosMeses(form.prazo) }}
              </span>
            </div>
            <TermPicker v-model="form.prazo" :options="TERM_OPTIONS" :invalid="!!errors.prazo" />
            <p v-if="errors.prazo" class="mt-1.5 text-xs text-red-600">{{ errors.prazo }}</p>
          </div>

          <div>
            <span class="mb-2 block text-xs text-neutral-500">Rentabilidade Contratada</span>
            <RateSelect
              v-model="form.rentabilidade"
              :options="rateOptions"
              :loading="indicatorsStatus === 'loading'"
              :invalid="!!errors.rentabilidade"
            />
            <p v-if="errors.rentabilidade" class="mt-1.5 text-xs text-red-600">
              {{ errors.rentabilidade }}
            </p>
          </div>
        </div>
      </SimCard>

      <SimulationActions
        primary-label="Criar Meta a partir desta Simulação"
        :editing="editing"
        :saving="saving"
        :can-save="canSave"
        :feedback="feedback"
        @save="submit"
      />
    </div>

    <InvestmentResults :result="result" :market-loading="indicatorsStatus === 'loading'" />
  </div>
</template>
