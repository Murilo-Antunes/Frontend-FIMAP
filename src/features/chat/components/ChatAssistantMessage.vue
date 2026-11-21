<script setup lang="ts">
import { computed } from 'vue'
import { renderAssistantContent } from '../services/assistant-content'
import ChatCodeBlock from './ChatCodeBlock.vue'
import ChatVisualBlock from './ChatVisualBlock.vue'

const props = defineProps<{ content: string; streaming: boolean }>()
const parts = computed(() => renderAssistantContent(props.content, props.streaming))
</script>

<template>
  <div class="min-w-0 space-y-3 text-[0.9375rem] leading-relaxed wrap-anywhere text-neutral-950">
    <p v-if="!parts.length && streaming" class="text-sm text-neutral-500">Preparando resposta…</p>
    <template v-for="(part, index) in parts" :key="index">
      <!-- O HTML do Markdown passa pela lista de permissões no renderizador. -->
      <div v-if="part.kind === 'markdown'" class="chat-markdown flow-root" v-html="part.html" />
      <ChatVisualBlock v-else-if="part.kind === 'visual'" :block="part.block" />
      <ChatCodeBlock v-else-if="part.kind === 'code'" :text="part.text" :label="part.label" :streaming="streaming" />
      <p v-else class="text-sm text-neutral-500" role="status">Preparando visualização…</p>
    </template>
  </div>
</template>

<style scoped>
.chat-markdown :deep(p + p) { margin-top: 0.75em; }

.chat-markdown :deep(h3),
.chat-markdown :deep(h4),
.chat-markdown :deep(h5),
.chat-markdown :deep(h6) {
  margin: 1.25em 0 0.45em;
  font-weight: 650;
  line-height: 1.4;
}

.chat-markdown :deep(h3) { font-size: 1.125rem; letter-spacing: -0.02em; }
.chat-markdown :deep(strong) { font-weight: 650; }
.chat-markdown :deep(ul) { list-style: disc; }
.chat-markdown :deep(ol) { list-style: decimal; }
.chat-markdown :deep(ul), .chat-markdown :deep(ol) { margin: 0.65em 0; padding-inline-start: 1.55em; }
.chat-markdown :deep(li + li) { margin-top: 0.25em; }
.chat-markdown :deep(li > ul), .chat-markdown :deep(li > ol) { margin-block: 0.25em; }

.chat-markdown :deep(a[href]) { color: var(--color-blue-800); text-decoration: underline; text-underline-offset: 0.16em; }
.chat-markdown :deep(:focus-visible) { outline: 2px solid var(--color-neutral-600); outline-offset: 2px; }
.chat-markdown :deep(hr) { margin: 1.15em 0; border-color: var(--color-neutral-200); }

.chat-markdown :deep(blockquote) {
  margin: 0.85em 0;
  border-inline-start: 3px solid var(--color-neutral-300);
  padding-inline-start: 0.8em;
  color: var(--color-neutral-700);
}

.chat-markdown :deep(code) { font-size: 0.875em; }
.chat-markdown :deep(:not(pre) > code) { border-radius: 0.25em; background: var(--color-neutral-100); padding: 0.12em 0.28em; }
.chat-markdown :deep(pre) { margin: 0.75em 0; overflow-x: auto; border-radius: 0.75rem; background: var(--color-neutral-100); padding: 0.75rem; }

.chat-markdown :deep(.chat-table) {
  margin: 0.85em 0;
  overflow-x: auto;
  border: 1px solid var(--color-neutral-200);
  border-radius: 0.75rem;
}
.chat-markdown :deep(table) {
  width: 100%;
  min-width: 24rem;
  border-collapse: collapse;
  font-size: 0.875rem;
  overflow-wrap: normal;
}
.chat-markdown :deep(th), .chat-markdown :deep(td) { padding: 0.6rem 0.75rem; vertical-align: top; }
.chat-markdown :deep(th) { background: var(--color-neutral-50); font-weight: 650; }
.chat-markdown :deep(td) { border-top: 1px solid var(--color-neutral-200); }
.chat-markdown :deep(th:not([align])), .chat-markdown :deep(td:not([align])) { text-align: start; }

.chat-markdown :deep(> :first-child) { margin-top: 0; }
.chat-markdown :deep(> :last-child) { margin-bottom: 0; }
</style>
