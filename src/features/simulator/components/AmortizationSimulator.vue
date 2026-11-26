<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMetaDraftStore } from '@/stores/meta-draft.store'
import { Car, Check, Info, Minus, Plus, Rocket, SlidersHorizontal, Percent } from 'lucide-vue-next'
import SimCard from './SimCard.vue'
import SimulationInfoCard from './SimulationInfoCard.vue'
import SimulationActions from './SimulationActions.vue'
import AmortizationResults from './AmortizationResults.vue'
import CurrencyField from './CurrencyField.vue'
import RangeSlider from './RangeSlider.vue'
import TermPicker from './TermPicker.vue'
import PercentField from './PercentField.vue'
import { useSimulationSave } from '../composables/useSimulationSave'
import { calculateAmortization } from '../lib/amortization'
import { formatBRLCompactLong, formatPrazoMesesAnos, roundMoney } from '../lib/format'
import { asAmortizationMode, asCalcSystem } from '../lib/guards'
import { amortizationToMetaDraft, META_CREATE_ROUTE } from '../lib/meta-draft'
import {
  LIMITS,
  validateAmortization,
  type AmortizationFormState,
  type FieldErrors,
} from '../schemas/simulator.schemas'
import type {
  AmortizationMode,
  AmortizationSimulation,
  CalcSystem,
  TermOption,
} from '../types/simulator.types'

const props = defineProps<{ record: AmortizationSimulation | null }>()
const emit = defineEmits<{ saved: [record: AmortizationSimulation] }>()

const TERM_OPTIONS: TermOption[] = [60, 120, 180, 240, 360].map((months) => ({
  label: `${months}M`,
  months,
}))

const SYSTEMS: { value: CalcSystem; label: string; hint: string; icon: typeof Info }[] = [
  {
    value: 'SAC',
    label: 'SAC (Decrescente)',
    hint: 'Amortização constante: as parcelas começam maiores e diminuem ao longo do contrato.',
    icon: Info,
  },
  {
    value: 'PRICE',
    label: 'PRICE (Fixa)',
    hint: 'Parcelas fixas: os juros pesam mais no início e a amortização cresce com o tempo.',
    icon: SlidersHorizontal,
  },
]

const MODES: { value: AmortizationMode; label: string; description: string }[] = [
  {
    value: 'REDUZIR_PRAZO',
    label: 'Reduzir Prazo',
    description: 'Elimina o efeito dos juros compostos nos períodos futuros mais distantes.',
  },
  {
    value: 'REDUZIR_PARCELA',
    label: 'Reduzir Valor da Parcela',
    description: 'Alivia o fluxo de caixa mensal imediato, recalculando a parcela sobre o saldo.',
  },
]

/** Simulação nova: título/descrição vazios, taxa em branco e parâmetros nos mínimos da tela. */
const BLANK: AmortizationFormState = {
  nome: '',
  descricao: '',
  saldo_devedor: 10000,
  prazo: 60,
  taxa: null,
  sistema_calculo: 'SAC',
  aporte_mensal: 0,
  modalidade: 'REDUZIR_PRAZO',
}

const form = reactive<AmortizationFormState>({ ...BLANK })
const errors = ref<FieldErrors>({})
const baseline = ref('')
const serialize = () => JSON.stringify({ ...form })

function fillFrom(record: AmortizationSimulation | null): void {
  Object.assign(
    form,
    record
      ? {
          nome: record.nome,
          descricao: record.descricao ?? '',
          saldo_devedor: record.saldo_devedor,
          prazo: record.prazo,
          taxa: record.taxa,
          sistema_calculo: asCalcSystem(record.sistema_calculo),
          aporte_mensal: record.aporte_mensal,
          modalidade: asAmortizationMode(record.modalidade),
        }
      : BLANK,
  )
  errors.value = {}
  baseline.value = serialize()
}

watch(() => props.record, fillFrom, { immediate: true })

const result = computed(() =>
  form.taxa === null
    ? null
    : calculateAmortization({
        saldoDevedor: form.saldo_devedor,
        prazoMeses: form.prazo,
        taxaAa: form.taxa,
        sistema: form.sistema_calculo,
        extraMensal: form.aporte_mensal,
        modalidade: form.modalidade,
      }),
)

const { saving, feedback, save, clearFeedback } = useSimulationSave('amortizacoes')

const editing = computed(() => props.record !== null)
const dirty = computed(() => serialize() !== baseline.value)
const canSave = computed(() => !editing.value || dirty.value)

watch(form, () => {
  if (feedback.value?.tone === 'success') clearFeedback()
})

function bumpExtra(direction: 1 | -1): void {
  form.aporte_mensal = Math.min(
    Math.max(roundMoney(form.aporte_mensal + direction * 100), 0),
    LIMITS.moneyMax,
  )
}

const router = useRouter()
const metaDraft = useMetaDraftStore()

/** Leva os dados da simulação (mesmo sem salvar) para a tela de criação de meta, já preenchida. */
async function createGoal(): Promise<void> {
  const validation = validateAmortization(form)
  const simulationResult = result.value
  if (!validation.ok || !simulationResult) {
    errors.value = validation.ok ? {} : validation.errors
    return
  }
  errors.value = {}
  const saved = await save(validation.payload, props.record?.id ?? null)
  if (!saved) return
  emit('saved', saved)
  metaDraft.set(amortizationToMetaDraft(form, simulationResult))
  void router.push({ name: META_CREATE_ROUTE })
}

async function submit(): Promise<void> {
  const validation = validateAmortization(form)
  if (!validation.ok) {
    errors.value = validation.errors
    return
  }
  errors.value = {}
  const saved = await save(validation.payload, props.record?.id ?? null)
  if (saved) emit('saved', saved)
}

const systemGroup = useId()
const modeGroup = useId()
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
    <div class="flex flex-col gap-6">
      <SimulationInfoCard
        v-model:nome="form.nome"
        v-model:descricao="form.descricao"
        nome-placeholder="Ex.: Financiamento do meu carro"
        descricao-placeholder="Por que você quer amortizar essa dívida? Descreva seu objetivo."
        :icon="Car"
        :nome-error="errors.nome"
        :descricao-error="errors.descricao"
      />

      <SimCard>
        <div class="mb-6 flex items-center justify-between gap-4">
          <h2 class="text-base font-semibold text-neutral-950">Parâmetros da Dívida</h2>
          <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
            Contrato Original
          </span>
        </div>

        <div class="space-y-7">
          <div>
            <div class="mb-3 flex items-baseline justify-between gap-4">
              <span class="text-sm text-neutral-600">Saldo Devedor Atual</span>
              <CurrencyField
                v-model="form.saldo_devedor"
                aria-label="Saldo devedor atual"
                :invalid="!!errors.saldo_devedor"
                class="w-56 bg-transparent text-right text-2xl font-bold tabular-nums text-neutral-950 outline-none"
              />
            </div>
            <RangeSlider
              v-model="form.saldo_devedor"
              label="Saldo devedor atual"
              :min="10000"
              :max="1000000"
              :step="5000"
              :min-label="formatBRLCompactLong(10000)"
              :max-label="formatBRLCompactLong(1000000)"
            />
            <p v-if="errors.saldo_devedor" class="mt-1.5 text-xs text-red-600">
              {{ errors.saldo_devedor }}
            </p>
          </div>

          <div>
            <div class="mb-3 flex items-baseline justify-between gap-4">
              <span class="text-sm text-neutral-600">Prazo Restante</span>
              <span class="text-sm font-semibold text-neutral-950">
                {{ formatPrazoMesesAnos(form.prazo) }}
              </span>
            </div>
            <TermPicker v-model="form.prazo" :options="TERM_OPTIONS" :invalid="!!errors.prazo" />
            <p v-if="errors.prazo" class="mt-1.5 text-xs text-red-600">{{ errors.prazo }}</p>
          </div>

          <div>
            <label
              class="flex items-center justify-between gap-4 rounded-xl bg-neutral-50 px-4 py-3.5"
            >
              <span class="flex items-center gap-3 text-sm text-neutral-700">
                <span class="grid size-8 place-items-center rounded-full bg-neutral-100">
                  <Percent class="size-3.5" aria-hidden="true" />
                </span>
                Taxa Contratada
              </span>
              <PercentField v-model="form.taxa" placeholder="0,00" :invalid="!!errors.taxa" />
            </label>
            <p v-if="errors.taxa" class="mt-1.5 text-xs text-red-600">{{ errors.taxa }}</p>
          </div>

          <fieldset>
            <legend class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Sistema de cálculo
            </legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="system in SYSTEMS"
                :key="system.value"
                :title="system.hint"
                class="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600"
                :class="
                  form.sistema_calculo === system.value
                    ? 'bg-neutral-950 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                "
              >
                <input
                  v-model="form.sistema_calculo"
                  type="radio"
                  :name="systemGroup"
                  :value="system.value"
                  class="sr-only"
                />
                <span class="flex items-center gap-2">
                  <Check v-if="form.sistema_calculo === system.value" class="size-4" aria-hidden="true" />
                  {{ system.label }}
                </span>
                <component :is="system.icon" class="size-4 opacity-70" aria-hidden="true" />
              </label>
            </div>
          </fieldset>
        </div>
      </SimCard>

      <SimCard>
        <div class="mb-5 flex items-center justify-between gap-4">
          <h2 class="flex items-center gap-3 text-base font-semibold text-neutral-950">
            <span class="grid size-9 place-items-center rounded-full bg-neutral-950 text-white">
              <Rocket class="size-4" aria-hidden="true" />
            </span>
            Aporte Extraordinário
          </h2>
          <span
            class="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold tracking-wider text-white"
          >
            ACELERAÇÃO
          </span>
        </div>

        <div class="rounded-2xl bg-neutral-100 px-4 py-5 text-center">
          <p class="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Valor adicional recorrente
          </p>
          <div class="mt-3 flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label="Diminuir aporte extraordinário"
              :disabled="form.aporte_mensal <= 0"
              class="grid size-11 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-40"
              @click="bumpExtra(-1)"
            >
              <Minus class="size-4" aria-hidden="true" />
            </button>
            <CurrencyField
              v-model="form.aporte_mensal"
              aria-label="Aporte extraordinário mensal"
              :invalid="!!errors.aporte_mensal"
              class="w-44 bg-transparent text-center text-3xl font-bold tabular-nums text-neutral-950 outline-none"
            />
            <button
              type="button"
              aria-label="Aumentar aporte extraordinário"
              class="grid size-11 place-items-center rounded-full bg-white shadow-sm transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
              @click="bumpExtra(1)"
            >
              <Plus class="size-4" aria-hidden="true" />
            </button>
          </div>
          <p class="mt-2 text-xs text-neutral-500">Aporte Mensal Previsto</p>
          <p v-if="errors.aporte_mensal" class="mt-1.5 text-xs text-red-600">
            {{ errors.aporte_mensal }}
          </p>
        </div>

        <fieldset class="mt-6">
          <legend class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Modalidade preferencial
          </legend>
          <div class="space-y-3">
            <label
              v-for="mode in MODES"
              :key="mode.value"
              class="flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600"
              :class="form.modalidade === mode.value ? 'bg-neutral-100' : 'bg-neutral-50 hover:bg-neutral-100'"
            >
              <input
                v-model="form.modalidade"
                type="radio"
                :name="modeGroup"
                :value="mode.value"
                class="sr-only"
              />
              <span
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2"
                :class="form.modalidade === mode.value ? 'border-neutral-950' : 'border-neutral-300'"
                aria-hidden="true"
              >
                <span v-if="form.modalidade === mode.value" class="size-2.5 rounded-full bg-neutral-950" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-neutral-950">{{ mode.label }}</span>
                <span class="mt-1 block text-xs leading-relaxed text-neutral-500">
                  {{ mode.description }}
                </span>
              </span>
            </label>
          </div>
        </fieldset>
      </SimCard>
    </div>

    <div class="flex flex-col gap-6">
      <AmortizationResults
        :result="result"
        :sistema="form.sistema_calculo"
        :extra-mensal="form.aporte_mensal"
      />

      <div class="mt-auto">
        <SimulationActions
          primary-label="Criar Plano de Amortização"
          :primary-disabled="result === null || saving"
          :editing="editing"
          :saving="saving"
          :can-save="canSave"
          :feedback="feedback"
          @save="submit"
          @primary="createGoal"
        />
      </div>
    </div>
  </div>
</template>
