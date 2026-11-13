<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { ContaRendimento } from '../types/metas.types'

const props = defineProps<{
  contas: ContaRendimento[]
  modelValue: number | null
  editavel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const aberto = ref(false)

const contaSelecionada = computed(() => props.contas.find((c) => c.id === props.modelValue) ?? null)

function selecionar(id: number) {
  emit('update:modelValue', id)
  aberto.value = false
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
        class="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
        :class="editavel === false ? 'cursor-default' : 'cursor-pointer hover:border-gray-300'"
        @click="editavel !== false && (aberto = !aberto)"
      >
        <span class="flex items-center gap-3 text-left">
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
              <template v-else-if="contaSelecionada.percentualCdi === null">CDI não encontrado</template>
              <template v-else>
                RDB com Liquidez Imediata ({{ Math.round(contaSelecionada.percentualCdi * 100) }}% CDI)
              </template>
            </span>
          </span>
        </span>
        <ChevronDown v-if="editavel !== false" class="h-4 w-4 text-gray-400" />
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
            {{ conta.percentualCdi === null ? 'CDI não encontrado' : `${Math.round(conta.percentualCdi * 100)}% CDI` }}
          </span>
        </button>
        <p v-if="contas.length === 0" class="px-4 py-2 text-sm text-gray-400">
          Nenhuma conexão bancária encontrada.
        </p>
      </div>
    </div>
  </div>
</template>
