<script setup lang="ts">
import { useId, type Component } from 'vue'
import SimCard from './SimCard.vue'
import { LIMITS } from '../schemas/simulator.schemas'

const nome = defineModel<string>('nome', { required: true })
const descricao = defineModel<string>('descricao', { required: true })

defineProps<{
  nomePlaceholder: string
  descricaoPlaceholder: string
  /** Ícone decorativo à direita do título (ex.: carro no financiamento) */
  icon?: Component
  nomeError?: string
  descricaoError?: string
}>()

const nomeId = useId()
const descricaoId = useId()
</script>

<template>
  <SimCard eyebrow="Informações da simulação">
    <div class="space-y-5">
      <div>
        <label :for="nomeId" class="mb-2 block text-xs text-neutral-500">Título</label>
        <div class="relative">
          <input
            :id="nomeId"
            v-model="nome"
            type="text"
            autocomplete="off"
            :maxlength="LIMITS.nomeMax"
            :placeholder="nomePlaceholder"
            :aria-invalid="nomeError ? true : undefined"
            :aria-describedby="nomeError ? `${nomeId}-erro` : undefined"
            class="w-full rounded-xl border bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-400 focus-visible:border-indigo-600"
            :class="[nomeError ? 'border-red-500' : 'border-neutral-200', icon ? 'pr-11' : '']"
          />
          <component
            :is="icon"
            v-if="icon"
            class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
        </div>
        <p v-if="nomeError" :id="`${nomeId}-erro`" class="mt-1.5 text-xs text-red-600">
          {{ nomeError }}
        </p>
      </div>

      <div>
        <div class="mb-2 flex items-baseline justify-between">
          <label :for="descricaoId" class="text-xs text-neutral-500">Descrição</label>
          <span class="text-[11px] tabular-nums text-neutral-400" aria-hidden="true">
            {{ descricao.length }}/{{ LIMITS.descricaoMax }}
          </span>
        </div>
        <textarea
          :id="descricaoId"
          v-model="descricao"
          rows="4"
          :maxlength="LIMITS.descricaoMax"
          :placeholder="descricaoPlaceholder"
          :aria-invalid="descricaoError ? true : undefined"
          class="w-full resize-none rounded-xl border bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800 outline-none placeholder:text-neutral-400 focus-visible:border-indigo-600"
          :class="descricaoError ? 'border-red-500' : 'border-neutral-200'"
        />
        <p v-if="descricaoError" class="mt-1.5 text-xs text-red-600">{{ descricaoError }}</p>
      </div>
    </div>
  </SimCard>
</template>
