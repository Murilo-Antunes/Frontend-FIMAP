
<script setup lang="ts">
import {
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'

interface Props {
  lineColor?: string
  backgroundColor?: string
  lineOpacity?: number
  lineWidth?: number
  intensity?: number
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  lineColor: '#D5D5D5',
  backgroundColor: '#FFFFFF',
  lineOpacity: 0.9,
  lineWidth: 1.1,
  intensity: 28,
  interactive: true,
})

interface Point {
  x: number
  y: number
}

interface Contour {
  id: number
  points: Point[]
  path: string
}

interface Terrain {
  x: number
  y: number
  radiusX: number
  radiusY: number
  rotation: number
  irregularity: number
  phase: number
}

const WIDTH = 1000
const HEIGHT = 700
const SEGMENTS = 150
const CONTOURS_PER_TERRAIN = 10

const svgElement = ref<SVGSVGElement | null>(null)
const contours = ref<Contour[]>([])

const pointer = {
  x: -1000,
  y: -1000,
  active: false,
  influence: 0,
}

let animationFrame = 0
let previousTime = 0
let destroyed = false

const terrains: Terrain[] = [
  {
    x: 210,
    y: 260,
    radiusX: 260,
    radiusY: 215,
    rotation: -0.18,
    irregularity: 0.17,
    phase: 0.4,
  },
  {
    x: 40,
    y: 20,
    radiusX: 220,
    radiusY: 185,
    rotation: 0.3,
    irregularity: 0.14,
    phase: 6,
  },
  {
    x: 100,
    y: 580,
    radiusX: 230,
    radiusY: 200,
    rotation: 0,
    irregularity: 0.19,
    phase: 2,
  },
]

function createBaseContours(): Contour[] {
  const result: Contour[] = []
  let id = 0

  terrains.forEach((terrain, terrainIndex) => {
    for (let level = 1; level <= CONTOURS_PER_TERRAIN; level++) {
      const scale = level / CONTOURS_PER_TERRAIN

      const points = Array.from(
        { length: SEGMENTS },
        (_, index): Point => {
          const angle = (index / SEGMENTS) * Math.PI * 2

          const wave =
            1 +
            terrain.irregularity *
              Math.sin(angle * 3 + terrain.phase) +
            terrain.irregularity *
              0.48 *
              Math.cos(angle * 5 - terrain.phase * 1.7) +
            0.035 * Math.sin(angle * 8 + terrain.phase)

          const radiusX = terrain.radiusX * scale * wave
          const radiusY =
            terrain.radiusY *
            scale *
            (1 +
              terrain.irregularity *
                0.6 *
                Math.cos(angle * 4 + terrain.phase)) *
            wave

          const localX = Math.cos(angle) * radiusX
          const localY = Math.sin(angle) * radiusY

          const cos = Math.cos(terrain.rotation)
          const sin = Math.sin(terrain.rotation)

          return {
            x: terrain.x + localX * cos - localY * sin,
            y: terrain.y + localX * sin + localY * cos,
          }
        },
      )

      result.push({
        id: id++,
        points,
        path: '',
      })
    }
  })

  return result
}

const baseContours = createBaseContours()

function createPath(points: Point[]): string {
  if (points.length === 0) return ''

  return (
    points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'

        return (
          `${command}${point.x.toFixed(2)},` +
          `${point.y.toFixed(2)}`
        )
      })
      .join(' ') + ' Z'
  )
}

function renderContours(delta: number) {
  // Suaviza a entrada e a saída do efeito.
  const targetInfluence =
    pointer.active && props.interactive ? 1 : 0

  const easing = 1 - Math.exp(-delta / 150)

  pointer.influence +=
    (targetInfluence - pointer.influence) * easing

  // Não é necessário atualizar o SVG se o efeito terminou.
  if (pointer.influence < 0.001 && !pointer.active) {
    pointer.influence = 0

    contours.value = baseContours.map((contour) => ({
      ...contour,
      path: contour.path || createPath(contour.points),
    }))

    return
  }

  const radius = 190
  const strength = props.intensity * pointer.influence

  contours.value = baseContours.map((contour) => {
    const points = contour.points.map((point) => {
      const dx = point.x - pointer.x
      const dy = point.y - pointer.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > radius || strength < 0.01) {
        return point
      }

      const normalizedDistance = distance / radius
      const falloff = Math.pow(1 - normalizedDistance, 2)

      const safeDistance = Math.max(distance, 0.001)
      const nx = dx / safeDistance
      const ny = dy / safeDistance

      // Deslocamento radial + componente tangencial:
      // cria uma deformação orgânica em vez de um círculo perfeito.
      const wave =
        Math.sin(distance * 0.035) * 0.35 +
        Math.cos(distance * 0.018) * 0.2

      const radial = strength * falloff * (0.65 + wave)
      const tangential = strength * falloff * 0.28

      return {
        x: point.x + nx * radial - ny * tangential,
        y: point.y + ny * radial + nx * tangential,
      }
    })

    return {
      ...contour,
      path: createPath(points),
    }
  })
}

function onPointerMove(event: PointerEvent) {
  if (!svgElement.value || !props.interactive) return

  const rect = svgElement.value.getBoundingClientRect()

  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom

  if (!inside) {
    pointer.active = false
    return
  }

  pointer.x = ((event.clientX - rect.left) / rect.width) * WIDTH
  pointer.y = ((event.clientY - rect.top) / rect.height) * HEIGHT
  pointer.active = true
}

function onWindowLeave() {
  pointer.active = false
}

onMounted(() => {
  contours.value = baseContours.map((contour) => ({
    ...contour,
    path: createPath(contour.points),
  }))

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('blur', onWindowLeave)

  animationFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  destroyed = true
  cancelAnimationFrame(animationFrame)

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('blur', onWindowLeave)
})


onMounted(() => {
  contours.value = baseContours.map((contour) => ({
    ...contour,
    path: createPath(contour.points),
  }))

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('blur', onWindowLeave)

  animationFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  destroyed = true
  cancelAnimationFrame(animationFrame)

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('blur', onWindowLeave)
})


function onPointerLeave() {
  pointer.active = false
}

function animate(time: number) {
  if (destroyed) return

  const delta = previousTime
    ? Math.min(time - previousTime, 50)
    : 16

  previousTime = time

  renderContours(delta)

  animationFrame = requestAnimationFrame(animate)
}

watch(
  () => props.interactive,
  (enabled) => {
    if (!enabled) {
      pointer.active = false
    }
  },
)

onMounted(() => {
  contours.value = baseContours.map((contour) => ({
    ...contour,
    path: createPath(contour.points),
  }))

  animationFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  destroyed = true
  cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <div
    class="topographic-background"
    :style="{
      '--topo-background': backgroundColor,
      '--topo-line': lineColor,
      '--topo-opacity': lineOpacity,
      '--topo-width': `${lineWidth}px`,
    }"
  >
    <svg
      ref="svgElement"
      class="topographic-background__svg"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @pointercancel="onPointerLeave"
    >
      <rect
        width="1000"
        height="700"
        :fill="backgroundColor"
      />

      <g
        fill="none"
        :stroke="lineColor"
        :stroke-opacity="lineOpacity"
        :stroke-width="lineWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          v-for="contour in contours"
          :key="contour.id"
          :d="contour.path"
          vector-effect="non-scaling-stroke"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.topographic-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--topo-background);
  pointer-events: none;
}

.topographic-background__svg {
  display: block;
  width: 150%;
  height: 150%;
  pointer-events: none;
}

.topographic-background__svg path {
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .topographic-background__svg {
    scroll-behavior: auto;
  }
}
</style>
