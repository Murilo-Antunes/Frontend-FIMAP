<script setup lang="ts">
import type { BandeiraCartao } from '../types/cards.types'

defineProps<{ bandeira: BandeiraCartao }>()
</script>

<template>
  <svg
    v-if="bandeira === 'mastercard'"
    width="40"
    height="24"
    viewBox="0 0 40 24"
    role="img"
    aria-label="Mastercard"
  >
    <circle cx="14" cy="12" r="12" fill="#eb001b" />
    <circle cx="26" cy="12" r="12" fill="#f79e1b" />
    <path d="M20 3.2a12 12 0 0 1 0 17.6 12 12 0 0 1 0-17.6Z" fill="#ff5f00" />
  </svg>
  <span v-else-if="bandeira === 'visa'" class="brand brand--visa" aria-label="Visa">VISA</span>
  <span v-else-if="bandeira === 'elo'" class="brand brand--elo" aria-label="Elo">elo</span>
  <span v-else-if="bandeira === 'amex'" class="brand" aria-label="American Express">AMEX</span>
  <span v-else class="brand" aria-hidden="true" />
</template>

<style scoped>
.brand {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.04em;
  line-height: 24px;
}
.brand--visa {
  font-style: italic;
  font-size: 20px;
}
.brand--elo {
  font-size: 20px;
  letter-spacing: -0.02em;
}
</style>
