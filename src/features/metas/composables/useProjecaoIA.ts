// src/features/metas/composables/useProjecaoIA.ts
import { computed, type Ref } from 'vue'

export interface ProjecaoIA {
  mesesEstimados: number
  dataEstimada: Date
  mesesEconomizados: number
  percentualCdiUsado: number
}

const TAXA_MENSAL_PADRAO = 0.0085 // ≈ 100% do CDI ao mês, usado quando não há conta vinculada
const FATOR_POUPANCA = 0.7 // poupança rende ~70% do CDI
const LIMITE_MESES = 600 // trava de segurança (50 anos)

function mesesParaAtingirMeta(
  valorAtual: number,
  valorDesejado: number,
  aporteMensal: number,
  taxaMensal: number,
): number {
  if (valorDesejado <= valorAtual) return 0
  if (aporteMensal <= 0 && taxaMensal <= 0) return LIMITE_MESES

  let saldo = valorAtual
  let meses = 0
  while (saldo < valorDesejado && meses < LIMITE_MESES) {
    saldo = saldo * (1 + taxaMensal) + aporteMensal
    meses += 1
  }
  return meses
}

/**
 * MOCK: simulação local de projeção enquanto a IA do Fimap não tem endpoint próprio no backend.
 * Quando existir, trocar o corpo por uma chamada HTTP mantendo a mesma interface de retorno.
 */
export function calcularProjecaoIA(params: {
  valorAtual: number
  valorDesejado: number
  aporteMensal: number
  percentualCdi?: number | null
}): ProjecaoIA {
  const percentualCdiUsado = params.percentualCdi ?? 1
  const taxa = TAXA_MENSAL_PADRAO * percentualCdiUsado

  const mesesComCdi = mesesParaAtingirMeta(params.valorAtual, params.valorDesejado, params.aporteMensal, taxa)
  const mesesPoupanca = mesesParaAtingirMeta(
    params.valorAtual,
    params.valorDesejado,
    params.aporteMensal,
    taxa * FATOR_POUPANCA,
  )

  const dataEstimada = new Date()
  dataEstimada.setMonth(dataEstimada.getMonth() + mesesComCdi)

  return {
    mesesEstimados: mesesComCdi,
    dataEstimada,
    mesesEconomizados: Math.max(mesesPoupanca - mesesComCdi, 0),
    percentualCdiUsado,
  }
}

/** Versão reativa, pronta pra usar direto num <template>. */
export function useProjecaoIA(params: {
  valorAtual: Ref<number>
  valorDesejado: Ref<number>
  aporteMensal: Ref<number>
  percentualCdi?: Ref<number | null>
}) {
  const projecao = computed<ProjecaoIA>(() =>
    calcularProjecaoIA({
      valorAtual: params.valorAtual.value,
      valorDesejado: params.valorDesejado.value,
      aporteMensal: params.aporteMensal.value,
      percentualCdi: params.percentualCdi?.value,
    }),
  )

  return { projecao }
}
