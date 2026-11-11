<script setup lang="ts">
import { formatBRL } from '@/lib/formatters'
import AssetIcon from './AssetIcon.vue'
import type { PortfolioAsset } from '../types/investments.types'

defineProps<{ asset: PortfolioAsset }>()
</script>

<template>
  <article class="flex flex-col rounded-3xl bg-white p-5 shadow-sm">
    <div class="flex items-start justify-between gap-2">
      <AssetIcon :class-key="asset.classKey" class="!size-10" />
      <span v-if="asset.badge" class="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-800">
        {{ asset.badge }}
      </span>
      <span v-else class="text-xs text-neutral-500">{{ asset.classLabel }}</span>
    </div>
    <h3 class="mt-4 truncate text-sm font-semibold text-neutral-900">{{ asset.name }}</h3>
    <p class="truncate text-xs text-neutral-500">{{ asset.subtitle || asset.classLabel }}</p>
    <div class="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 text-xs">
      <span class="text-neutral-500">Posição</span>
      <span class="font-semibold text-neutral-900">{{ formatBRL(asset.balance) }}</span>
    </div>
  </article>
</template>
