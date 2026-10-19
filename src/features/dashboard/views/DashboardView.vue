
<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function voltarLogin() {
  router.push('/login')
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-950 p-6">
    <section class="flex flex-col items-center gap-6 rounded-2xl border border-slate-700 bg-slate-900 p-10 text-center shadow-xl">
      <h1 class="text-4xl font-bold text-white">
        Dashboard FIMAP
      </h1>

      <p class="text-slate-400">
        Roteamento funcionando!
      </p>

      <button
        type="button"
        class="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
        @click="voltarLogin"
      >
        Voltar para o login
      </button>
    </section>
  </main>
</template>
