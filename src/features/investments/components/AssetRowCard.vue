<script setup lang="ts">
import { formatBRL, formatPercent, formatSignedBRL } from '@/lib/formatters'
import AssetIcon from './AssetIcon.vue'
import type { PortfolioAsset } from '../types/investments.types'

defineProps<{ asset: PortfolioAsset }>()
</script>

<template>
  <article class="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
    <AssetIcon :class-key="asset.classKey" />
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-base font-semibold text-neutral-900">{{ asset.name }}</h3>
      <p class="truncate text-xs text-neutral-500">{{ asset.subtitle || asset.classLabel }}</p>
    </div>
    <div class="shrink-0 text-right">
      <p class="text-base font-semibold tabular-nums text-neutral-900">{{ formatBRL(asset.balance) }}</p>
      <span
        v-if="asset.profit !== null"
        class="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
        :class="asset.profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'"
      >
        {{ formatSignedBRL(asset.profit) }}
        <template v-if="asset.profitPct !== null">
          ({{ asset.profitPct >= 0 ? '+' : '-' }}{{ formatPercent(Math.abs(asset.profitPct)) }})
        </template>
      </span>
    </div>
  </article>
</template>
