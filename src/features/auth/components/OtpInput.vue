<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

const props = withDefaults(
  defineProps<{ modelValue: string; length?: number; disabled?: boolean; invalid?: boolean }>(),
  { length: 6 },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputs = ref<(HTMLInputElement | null)[]>([])

const digits = computed(() =>
  Array.from({ length: props.length }, (_, index) => props.modelValue[index] ?? ''),
)

function focusAt(index: number) {
  nextTick(() => inputs.value[Math.max(0, Math.min(index, props.length - 1))]?.focus())
}

function emitDigits(list: string[]) {
  emit('update:modelValue', list.join(''))
}

function onInput(event: Event, index: number) {
  const char = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1)
  const next = digits.value.slice()
  next[index] = char
  emitDigits(next)
  if (char) focusAt(index + 1)
  // Mantém o DOM sincronizado caso o caractere digitado tenha sido descartado
  ;(event.target as HTMLInputElement).value = char
}

function onKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    event.preventDefault()
    const next = digits.value.slice()
    next[index - 1] = ''
    emitDigits(next)
    focusAt(index - 1)
  } else if (event.key === 'ArrowLeft') {
    focusAt(index - 1)
  } else if (event.key === 'ArrowRight') {
    focusAt(index + 1)
  }
}

function onPaste(event: ClipboardEvent, index: number) {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
  if (!pasted) return
  const next = digits.value.slice()
  let position = index
  for (const char of pasted) {
    if (position >= props.length) break
    next[position] = char
    position += 1
  }
  emitDigits(next)
  focusAt(position)
}
</script>

<template>
  <div class="flex justify-center gap-2" role="group" aria-label="Código de verificação">
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(el) => (inputs[index] = el as HTMLInputElement | null)"
      :value="digit"
      :disabled="disabled"
      :aria-label="`Dígito ${index + 1} de ${length}`"
      :aria-invalid="invalid"
      type="text"
      inputmode="numeric"
      maxlength="1"
      placeholder="0"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      class="size-11 rounded-lg border bg-white text-center text-lg font-medium outline-none transition placeholder:text-neutral-300 focus:border-black focus:ring-2 focus:ring-black/10 disabled:opacity-60 sm:h-14 sm:w-12"
      :class="invalid ? 'border-red-500' : 'border-neutral-200'"
      @input="onInput($event, index)"
      @keydown="onKeydown($event, index)"
      @paste="onPaste($event, index)"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>
