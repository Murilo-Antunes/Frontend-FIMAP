<script setup lang="ts">
import { computed, ref, useId, useSlots } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'email' | 'password'
    placeholder?: string
    error?: string
    autocomplete?: string
    inputmode?: 'text' | 'numeric' | 'email'
    disabled?: boolean
    /** Mostra o botão de mostrar/ocultar senha (apenas para type="password"). */
    revealable?: boolean
  }>(),
  { type: 'text', revealable: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const id = useId()
const errorId = computed(() => `${id}-error`)
const visible = ref(false)

const inputType = computed(() =>
  props.type === 'password' && props.revealable && visible.value ? 'text' : props.type,
)
const slots = useSlots()
const hasIcon = computed(() => Boolean(slots.icon))

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-neutral-800">{{ label }}</label>

    <div class="relative">
      <span
        v-if="hasIcon"
        class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-neutral-500"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>

      <input
        :id="id"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? errorId : undefined"
        class="h-12 w-full rounded-xl border bg-white text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
        :class="[
          error ? 'border-red-500' : 'border-neutral-200',
          hasIcon ? 'pl-11' : 'pl-4',
          type === 'password' && revealable ? 'pr-11' : 'pr-4',
        ]"
        @input="onInput"
      />

      <button
        v-if="type === 'password' && revealable"
        type="button"
        class="absolute inset-y-0 right-3 flex items-center rounded-md px-1 text-neutral-500 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-black"
        :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <EyeOff v-if="!visible" :size="20" />
        <Eye v-else :size="20" />
      </button>
    </div>

    <p v-if="error" :id="errorId" class="text-xs text-red-600" role="alert">{{ error }}</p>
  </div>
</template>
