<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { ContaRendimento } from '../types/metas.types'
import { contasRendimentoService } from '../services/contas-rendimento.service'

const props = defineProps<{
  contas: ContaRendimento[]
  modelValue: number | null
  idUsuario: number
  editavel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  /** Avisa o pai que o CDI de uma conta foi definido manualmente, pra atualizar a lista local. */
  'cdi-atualizado': [payload: { id: number; percentualCdi: number }]
}>()

const aberto = ref(false)
const percentualManualInput = ref<number | null>(null)
const salvandoManual = ref(false)
const erroManual = ref<string | null>(null)

const contaSelecionada = computed(() => props.contas.find((c) => c.id === props.modelValue) ?? null)

// Limpa o formulário de CDI manual sempre que a conta selecionada muda.
watch(
  () => contaSelecionada.value?.id,
  () => {
    percentualManualInput.value = null
    erroManual.value = null
  },
)

function selecionar(id: number) {
  emit('update:modelValue', id)
  aberto.value = false
}

async function salvarCdiManual() {
  if (!contaSelecionada.value) return

  if (percentualManualInput.value === null || Number.isNaN(percentualManualInput.value) || percentualManualInput.value < 0) {
    erroManual.value = 'Informe um percentual válido (ex.: 100).'
    return
  }

  erroManual.value = null
  salvandoManual.value = true
  try {
    const percentualCdi = percentualManualInput.value / 100
    await contasRendimentoService.atualizarCdiManual(props.idUsuario, contaSelecionada.value.id, percentualCdi)
    emit('cdi-atualizado', { id: contaSelecionada.value.id, percentualCdi })
  } catch (e) {
    erroManual.value = 'Não foi possível salvar o CDI agora. Tente novamente.'
  } finally {
    salvandoManual.value = false
  }
}
</script>

<template>
  <div>
    <span class="text-xs font-medium text-gray-400 tracking-wide">
      {{ editavel === false ? 'CONTA VINCULADA DE RENDIMENTO' : 'Onde aplicar o dinheiro' }}
    </span>

    <div class="relative mt-2">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:border-gray-300 transition-colors"
          @click="aberto = !aberto"
        >
          <span class="flex items-center gap-3 text-left pointer-events-none">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700"
            >
              {{ (contaSelecionada?.banco ?? '??').slice(0, 2).toUpperCase() }}
            </span>
            <span>
              <span class="block text-sm font-medium text-gray-900">
                {{ contaSelecionada ? `${contaSelecionada.banco} · ${contaSelecionada.apelido}` : 'Selecione uma conta' }}
              </span>
              <span class="block text-xs text-gray-400">
                <template v-if="!contaSelecionada">Nenhuma conta selecionada</template>
                <template v-else-if="contaSelecionada.percentualCdi === null">Sem CDI vinculado</template>
                <template v-else>
                  RDB com Liquidez Imediata ({{ Math.round(contaSelecionada.percentualCdi * 100) }}% CDI)
                </template>
              </span>
            </span>
          </span>
          <ChevronDown class="h-4 w-4 text-gray-400 pointer-events-none" />
        </button>

      <div
        v-if="aberto"
        class="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
      >
        <button
          v-for="conta in contas"
          :key="conta.id"
          type="button"
          class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
          @click="selecionar(conta.id)"
        >
          <span>{{ conta.banco }} · {{ conta.apelido }}</span>
          <span class="text-xs text-gray-400">
            {{ conta.percentualCdi === null ? 'Sem CDI vinculado' : `${Math.round(conta.percentualCdi * 100)}% CDI` }}
          </span>
        </button>
        <p v-if="contas.length === 0" class="px-4 py-2 text-sm text-gray-400">
          Nenhuma conexão bancária encontrada.
        </p>
      </div>
    </div>

    <!-- CDI não encontrado automaticamente: deixa o usuário informar na mão. -->
    <div
      v-if="contaSelecionada && contaSelecionada.percentualCdi === null"
      class="mt-2 rounded-xl border border-dashed border-gray-300 bg-white p-3"
    >
      <p class="text-xs text-gray-500">
        Não conseguimos identificar automaticamente o rendimento dessa conta. Você sabe quanto ela rende?
      </p>
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model.number="percentualManualInput"
          type="number"
          min="0"
          step="1"
          placeholder="100"
          class="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
        />
        <span class="text-sm text-gray-500">% do CDI</span>
        <button
          type="button"
          :disabled="salvandoManual"
          class="ml-auto rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-60"
          @click="salvarCdiManual"
        >
          {{ salvandoManual ? 'Salvando…' : 'Salvar' }}
        </button>
      </div>
      <p v-if="erroManual" class="mt-1 text-xs text-red-500">{{ erroManual }}</p>
    </div>
  </div>
</template>
