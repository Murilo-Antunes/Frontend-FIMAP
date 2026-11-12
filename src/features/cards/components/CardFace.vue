<script setup lang="ts">
import { computed } from 'vue'
import { CreditCard } from 'lucide-vue-next'
import type { Cartao } from '../types/cards.types'
import { resolverTema } from '../utils/card-theme'
import { formatarDiaMes, formatarMoeda } from '../utils/format'
import CardBrandMark from './CardBrandMark.vue'

const props = withDefaults(
  defineProps<{
    cartao: Cartao
    /** Nome do titular (o backend de cartões não informa; vem do usuário logado). */
    titular?: string | null
    /**
     * Modo "aba" da carteira: mostra só o cabeçalho compacto (ícone, nome e
     * final do número). Com `false` mostra o design completo do cartão.
     */
    compacto?: boolean
  }>(),
  { titular: null, compacto: false },
)

const tema = computed(() => resolverTema(props.cartao.tema))
const rotuloSuperior = computed(() => props.cartao.instituicao ?? 'Cartão de crédito')
const vencimento = computed(() => formatarDiaMes(props.cartao.vencimentoFatura))
</script>

<template>
  <article
    class="card-face"
    :style="{
      '--face-bg': tema.fundo,
      '--face-fg': tema.texto,
      '--face-chip': tema.chip,
      '--face-orb1': tema.orb1,
      '--face-orb2': tema.orb2,
      '--face-sheen': tema.sheen,
    }"
    :data-compacto="compacto"
    :data-escuro="tema.escuro"
  >
    <!-- Camadas decorativas do gradiente -->
    <div class="card-face__orb card-face__orb--1" aria-hidden="true" />
    <div class="card-face__orb card-face__orb--2" aria-hidden="true" />
    <div class="card-face__sheen" aria-hidden="true" />

    <!-- Cabeçalho compacto (aba da carteira) -->
    <header class="card-face__compact" :aria-hidden="!compacto">
      <span class="card-face__bubble">
        <CreditCard :size="16" :stroke-width="2" />
      </span>
      <span class="card-face__compact-title">{{ cartao.nome }}</span>
      <span v-if="cartao.finalNumero" class="card-face__pill card-face__pill--mono">
        •• {{ cartao.finalNumero }}
      </span>
    </header>

    <!-- Design completo -->
    <div class="card-face__full" :aria-hidden="compacto">
      <div class="card-face__row">
        <div class="min-w-0">
          <p class="card-face__label">{{ rotuloSuperior }}</p>
          <p class="card-face__name">{{ cartao.nome }}</p>
        </div>
        <div class="card-face__icons">
          <!-- Ícone NFC -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="card-face__nfc">
            <path d="M6.5 7.5A7 7 0 0 1 6.5 16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
            <path d="M9.5 9.5A4 4 0 0 1 9.5 14.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
            <path d="M12.5 11A1.5 1.5 0 0 1 12.5 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <!-- Chip EMV -->
          <span class="card-face__chip" aria-hidden="true">
            <span class="card-face__chip-line card-face__chip-line--h" />
            <span class="card-face__chip-line card-face__chip-line--v" />
          </span>
        </div>
      </div>

      <div class="card-face__row card-face__row--center">
        <p v-if="cartao.finalNumero" class="card-face__number" :aria-label="`Final ${cartao.finalNumero}`">
          <span v-for="grupo in 3" :key="grupo" class="card-face__dots" aria-hidden="true">
            <i v-for="ponto in 4" :key="ponto" />
          </span>
          <span>{{ cartao.finalNumero }}</span>
        </p>
        <div v-else-if="cartao.limiteDisponivel !== null" class="min-w-0">
          <p class="card-face__label card-face__label--small">Limite disponível</p>
          <p class="card-face__amount">{{ formatarMoeda(cartao.limiteDisponivel) }}</p>
        </div>
        <span v-else />

        <span v-if="vencimento" class="card-face__pill card-face__pill--exp">VENCE {{ vencimento }}</span>
      </div>

      <div class="card-face__row card-face__row--end">
        <div class="min-w-0">
          <template v-if="titular">
            <p class="card-face__label card-face__label--small">Titular</p>
            <p class="card-face__holder">{{ titular }}</p>
          </template>
        </div>
        <CardBrandMark :bandeira="cartao.bandeira" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.card-face {
  --card-h: 250px;
  position: relative;
  isolation: isolate;
  width: 100%;
  height: var(--card-h);
  overflow: hidden;
  border-radius: 24px;
  background: var(--face-bg);
  color: var(--face-fg);
  box-shadow: 0 10px 30px -14px rgb(0 0 0 / 0.4);
  transition: box-shadow 0.35s ease;
  text-align: left;
}

.card-face.is-active {
  box-shadow: 0 26px 50px -18px rgb(0 0 0 / 0.5);
}

/* ── Orbs decorativos ── */
.card-face__orb {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
}
.card-face__orb--1 {
  top: -60px;
  right: -40px;
  width: 240px;
  height: 240px;
  background: var(--face-orb1);
  opacity: 1;
}
.card-face__orb--2 {
  bottom: -50px;
  left: -30px;
  width: 200px;
  height: 200px;
  background: var(--face-orb2);
  opacity: 1;
}

/* ── Sheen direcional ── */
.card-face__sheen {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--face-sheen);
  pointer-events: none;
}

/* ── Camada compacta ── */
.card-face__compact {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 1;
  display: flex;
  height: 66px;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.card-face[data-compacto='true'] .card-face__compact {
  opacity: 1;
  transition-delay: 0.1s;
}

.card-face__bubble {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.2);
}
/* tema claro: bolha mais escura */
.card-face[data-escuro='true'] .card-face__bubble {
  background: rgb(0 0 0 / 0.1);
}

.card-face__compact-title {
  min-width: 0;
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-face__pill {
  margin-left: auto;
  flex: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1;
}
.card-face__pill--mono {
  background: rgb(0 0 0 / 0.12);
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
}
.card-face__pill--exp {
  margin-left: 0;
  background: rgb(255 255 255 / 0.14);
  font-size: 11px;
  letter-spacing: 0.02em;
}
.card-face[data-escuro='true'] .card-face__pill--exp {
  background: rgb(0 0 0 / 0.08);
}

/* ── Camada completa ── */
.card-face__full {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  opacity: 1;
  transition: opacity 0.3s ease 0.05s;
}
.card-face[data-compacto='true'] .card-face__full {
  opacity: 0;
  transition-delay: 0s;
}

.card-face__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.card-face__row--center { align-items: center; }
.card-face__row--end    { align-items: flex-end; }

.card-face__label {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.6;
}
.card-face__label--small {
  font-size: 10px;
  opacity: 0.5;
}
.card-face__name {
  margin-top: 4px;
  overflow: hidden;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-face__amount {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.card-face__holder {
  margin-top: 2px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Ícone NFC ── */
.card-face__nfc {
  opacity: 0.75;
}

/* ── Chip EMV ── */
.card-face__icons {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
}
.card-face__chip {
  position: relative;
  width: 34px;
  height: 24px;
  flex: none;
  border-radius: 5px;
  background: var(--face-chip);
  box-shadow: inset 0 1px 2px rgb(255 255 255 / 0.35), 0 1px 3px rgb(0 0 0 / 0.25);
  overflow: hidden;
}
/* linhas do chip */
.card-face__chip-line {
  position: absolute;
  background: rgb(0 0 0 / 0.14);
}
.card-face__chip-line--h {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  transform: translateY(-50%);
}
.card-face__chip-line--v {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
}

/* ── Número ── */
.card-face__number {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.16em;
}
.card-face__dots {
  display: inline-flex;
  gap: 3px;
}
.card-face__dots i {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.75;
}
</style>
