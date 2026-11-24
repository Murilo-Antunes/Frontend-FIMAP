<script setup lang="ts">
export interface SecaoDocumento {
  titulo: string
  paragrafos: string[]
}

defineProps<{
  titulo: string
  subtitulo: string
  secoes: SecaoDocumento[]
  /** Mostra o aviso "texto provisório". Remova depois que o texto for revisado. */
  provisorio?: boolean
}>()
</script>

<template>
  <div class="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-[60px]">
    <div class="max-w-3xl">
      <h1 class="text-xl font-semibold text-neutral-900">{{ titulo }}</h1>
      <p class="mt-1 text-sm leading-relaxed text-neutral-500">{{ subtitulo }}</p>

      <p
        v-if="provisorio"
        class="mt-5 rounded-xl bg-neutral-100 px-4 py-3 text-xs leading-relaxed text-neutral-600"
      >
        Texto provisório — será revisado antes da versão final.
      </p>

      <article class="mt-6 rounded-2xl bg-white px-6 py-2 shadow-sm">
        <section
          v-for="(secao, i) in secoes"
          :key="secao.titulo"
          class="py-5"
          :class="i > 0 ? 'border-t border-neutral-100' : ''"
        >
          <h2 class="text-sm font-semibold text-neutral-900">{{ i + 1 }}. {{ secao.titulo }}</h2>
          <p
            v-for="paragrafo in secao.paragrafos"
            :key="paragrafo"
            class="mt-2 text-sm leading-relaxed text-neutral-600"
          >
            {{ paragrafo }}
          </p>
        </section>
      </article>
    </div>
  </div>
</template>
