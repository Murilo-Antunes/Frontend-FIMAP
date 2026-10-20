<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useHiddenValues } from '@/composables/useHiddenValues'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    icon: Component
    footerLabel: string
    footerValue: string
    /** 0 a 100 */
    progress: number
    tone?: 'dark' | 'light'
  }>(),
  { tone: 'light' },
)

const { mask } = useHiddenValues()
const barWidth = computed(() => `${Math.min(100, Math.max(0, props.progress))}%`)
</script>

<template>
  <article
    class="flex flex-col justify-between gap-4 rounded-3xl p-5"
    :class="
      tone === 'dark'
        ? 'bg-neutral-950 text-white'
        : 'border border-neutral-100 bg-white text-neutral-900 shadow-sm'
    "
  >
    <header class="flex items-center justify-between">
      <h3
        class="text-[11px] font-medium uppercase tracking-wider"
        :class="tone === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
      >
        {{ label }}
      </h3>
      <component
        :is="icon"
        :size="14"
        :class="tone === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
        aria-hidden="true"
      />
    </header>

    <p class="text-2xl font-semibold tracking-tight">{{ mask(value) }}</p>

    <div>
      <div
        class="mb-2 flex items-center justify-between text-xs"
        :class="tone === 'dark' ? 'text-neutral-400' : 'text-neutral-500'"
      >
        <span>{{ footerLabel }}</span>
        <span :class="tone === 'dark' ? 'text-white' : 'text-neutral-900'">{{ footerValue }}</span>
      </div>
      <div
        class="h-1.5 w-full overflow-hidden rounded-full"
        :class="tone === 'dark' ? 'bg-white/15' : 'bg-neutral-100'"
        aria-hidden="true"
      >
        <div
          class="h-full rounded-full"
          :class="tone === 'dark' ? 'bg-white' : 'bg-neutral-950'"
          :style="{ width: barWidth }"
        />
      </div>
    </div>
  </article>
</template>
