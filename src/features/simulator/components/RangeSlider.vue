<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<number>({ required: true })

const props = defineProps<{
  label: string
  min: number
  max: number
  step: number
  minLabel: string
  maxLabel: string
}>()

// O valor digitado pode ficar fora do intervalo do slider; ele só "gruda" na borda visualmente.
const clamped = computed(() => Math.min(Math.max(model.value, props.min), props.max))
const fill = computed(() => `${((clamped.value - props.min) / (props.max - props.min)) * 100}%`)

function onInput(event: Event): void {
  model.value = Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div>
    <input
      type="range"
      class="sim-range"
      :min="min"
      :max="max"
      :step="step"
      :value="clamped"
      :aria-label="label"
      :style="{ '--fill': fill }"
      @input="onInput"
    />
    <div class="mt-1.5 flex justify-between text-[11px] text-neutral-400">
      <span>{{ minLabel }}</span>
      <span>{{ maxLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.sim-range {
  appearance: none;
  display: block;
  width: 100%;
  height: 6px;
  border-radius: 9999px;
  cursor: pointer;
  background: linear-gradient(to right, #0a0a0a var(--fill), #e5e5e5 var(--fill));
}
.sim-range::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: #0a0a0a;
  border: 3px solid #fff;
  box-shadow:
    0 0 0 1px #d4d4d4,
    0 2px 6px rgba(0, 0, 0, 0.25);
}
.sim-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #0a0a0a;
  border: 3px solid #fff;
  box-shadow:
    0 0 0 1px #d4d4d4,
    0 2px 6px rgba(0, 0, 0, 0.25);
}
.sim-range:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 6px;
}
</style>
