<script setup lang="ts">
import { computed } from 'vue'
import { Bitcoin, Building2, Landmark, Package, TrendingUp } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { AssetClassKey } from '../types/investments.types'

const props = defineProps<{ classKey: AssetClassKey }>()

const ICONS: Record<AssetClassKey, Component> = {
  'renda-fixa': Landmark,
  'acoes-etfs': TrendingUp,
  fiis: Building2,
  fundos: Package,
  'cripto-internacional': Bitcoin,
  outros: Package,
}
const icon = computed(() => ICONS[props.classKey])
</script>

<template>
  <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
    <component :is="icon" class="size-5" aria-hidden="true" />
  </div>
</template>
