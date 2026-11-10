<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Cartao } from '../types/cards.types'
import CardFace from './CardFace.vue'

/**
 * Carteira de cartões.
 *
 * Em repouso os cartões ficam empilhados mostrando só uma "aba" de cada. Ao
 * passar o mouse (ou focar) em um cartão ele sobe e os que estão à frente
 * descem, deixando o design completo visível. Ao sair, tudo volta à carteira.
 *
 * O primeiro cartão da lista vem da API como "principal" e fica na frente.
 */

const ALTURA_CARTAO = 250
const ABA = 70 // parte visível de cada cartão em repouso
const ELEVACAO = 28 // quanto o cartão ativo sobe
const FOLGA = 14 // respiro entre o cartão ativo e o próximo
const EMPURRAO = ALTURA_CARTAO - ABA - ELEVACAO + FOLGA // quanto os da frente descem

const props = defineProps<{
  cartoes: Cartao[]
  /** Cartão que recebe o view-transition-name (transição para o detalhe). */
  cartaoTransicaoId?: string | null
  /** Titular exibido nos cartões (vem do usuário logado). */
  titular?: string | null
}>()

const emit = defineEmits<{ select: [cartao: Cartao] }>()

const palco = ref<HTMLElement | null>(null)
const ativo = ref<number | null>(null)

// Do fundo para a frente: o principal (índice 0 da API) é o último no DOM.
const camadas = computed(() => [...props.cartoes].reverse())

const alturaPalco = computed(() => {
  const n = camadas.value.length
  if (n === 0) return 0
  return ELEVACAO + (n - 1) * ABA + ALTURA_CARTAO + (n > 1 ? EMPURRAO : 0)
})

function deslocamento(indice: number): number {
  if (ativo.value === null) return 0
  if (indice === ativo.value) return -ELEVACAO
  return indice > ativo.value ? EMPURRAO : 0
}

function estaCompacto(indice: number): boolean {
  return indice < camadas.value.length - 1 && indice !== ativo.value
}

function aoSairFoco(evento: FocusEvent): void {
  const destino = evento.relatedTarget as Node | null
  if (!destino || !palco.value?.contains(destino)) ativo.value = null
}

function descricao(c: Cartao): string {
  return c.finalNumero ? `${c.nome}, final ${c.finalNumero}` : c.nome
}
</script>

<template>
  <div
    ref="palco"
    class="card-stack"
    :style="{ height: `${alturaPalco}px` }"
    role="list"
    @pointerleave="ativo = null"
    @focusout="aoSairFoco"
  >
    <div
      v-for="(cartao, indice) in camadas"
      :key="cartao.id"
      class="card-stack__slot"
      role="listitem"
      :style="{
        top: `${ELEVACAO + indice * ABA}px`,
        zIndex: indice + 1,
        transform: `translateY(${deslocamento(indice)}px)`,
      }"
    >
      <button
        type="button"
        class="card-stack__btn"
        :aria-label="`Abrir cartão ${descricao(cartao)}`"
        @pointerenter="ativo = indice"
        @focus="ativo = indice"
        @click="emit('select', cartao)"
      >
        <CardFace
          :cartao="cartao"
          :titular="titular"
          :compacto="estaCompacto(indice)"
          :class="{ 'is-active': ativo === indice }"
          :style="cartaoTransicaoId === cartao.id ? { viewTransitionName: 'cartao-ativo' } : undefined"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.card-stack {
  position: relative;
  width: min(470px, 100%);
  margin-inline: auto;
}

.card-stack__slot {
  position: absolute;
  left: 0;
  width: 100%;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.card-stack__btn {
  display: block;
  width: 100%;
  cursor: pointer;
  border-radius: 24px;
  background: none;
  padding: 0;
  text-align: left;
}

.card-stack__btn:focus-visible {
  outline: 3px solid #5b4fe0;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .card-stack__slot {
    transition: none;
  }
}
</style>
