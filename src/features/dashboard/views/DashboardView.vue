
<script setup lang="ts">

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

      <RouterLink
      :to="{ name: 'login' }"
      class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
      >
        voltar ao login
    </RouterLink>
    </section>
  </main>
</template>
