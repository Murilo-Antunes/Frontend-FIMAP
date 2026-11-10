<script setup lang="ts">
import type { GrupoLancamentos } from '../types/cards-statement.types'
import { iconeLancamento } from '../utils/statement-icons'
import { detalheLancamento, subtituloLancamento, valorLancamento } from '../utils/statement'

defineProps<{ grupo: GrupoLancamentos }>()
</script>

<template>
  <section
    class="rounded-3xl border border-neutral-200 bg-white px-6 pb-2 pt-6 shadow-sm"
    :aria-labelledby="`dia-${grupo.chave}`"
  >
    <h2
      :id="`dia-${grupo.chave}`"
      class="text-[11px] font-medium uppercase tracking-wider text-neutral-500"
    >
      {{ grupo.rotulo }}
    </h2>

    <ul class="mt-3 divide-y divide-neutral-100">
      <li v-for="lancamento in grupo.lancamentos" :key="lancamento.id" class="flex items-center gap-4 py-3.5">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-full"
          :class="
            lancamento.tipo === 'pagamento'
              ? 'bg-emerald-50 text-emerald-500'
              : 'bg-neutral-100 text-neutral-800'
          "
        >
          <component :is="iconeLancamento(lancamento)" class="size-5" aria-hidden="true" />
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-neutral-900">{{ lancamento.descricao }}</p>
          <p
            class="mt-0.5 truncate text-xs"
            :class="lancamento.tipo === 'pagamento' ? 'text-emerald-500' : 'text-neutral-500'"
          >
            {{ subtituloLancamento(lancamento) }}
          </p>
        </div>

        <div class="shrink-0 text-right">
          <p
            class="text-sm font-semibold"
            :class="lancamento.tipo === 'pagamento' ? 'text-emerald-500' : 'text-neutral-950'"
          >
            {{ valorLancamento(lancamento) }}
          </p>
          <p class="mt-0.5 text-xs text-neutral-500">{{ detalheLancamento(lancamento) }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
