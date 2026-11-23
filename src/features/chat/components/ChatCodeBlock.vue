<script setup lang="ts">
import { ref, watch } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

const props = defineProps<{ text: string; label: string; streaming: boolean }>()
const copyStatus = ref('')

watch(() => props.text, () => { copyStatus.value = '' })

async function copyCode() {
  const text = props.text
  try {
    await navigator.clipboard.writeText(text)
    if (props.text === text) copyStatus.value = 'Copiado'
  } catch {
    if (props.text === text) copyStatus.value = 'Não foi possível copiar'
  }
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
    <div class="flex min-h-9 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-neutral-200 px-3 py-1.5 text-xs text-neutral-700">
      <span class="font-medium">{{ label }}</span>
      <button v-if="!streaming" type="button" class="flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-600"
        aria-label="Copiar trecho de código" @click="copyCode">
        <Check v-if="copyStatus === 'Copiado'" :size="13" aria-hidden="true" />
        <Copy v-else :size="13" aria-hidden="true" />
        <span role="status">{{ copyStatus || 'Copiar' }}</span>
      </button>
    </div>
    <pre tabindex="0" class="overflow-auto px-3 py-3 text-xs leading-relaxed whitespace-pre focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-600"><code>{{ text }}</code></pre>
  </div>
</template>
