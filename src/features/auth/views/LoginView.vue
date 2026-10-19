
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const senha = ref('')

function fazerLogin() {
  router.push('/dashboard')
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-950 p-6">
    <form
      class="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8"
      @submit.prevent="fazerLogin"
    >
      <div class="text-center">
        <h1 class="text-3xl font-bold text-white">FIMAP</h1>
        <p class="mt-2 text-slate-400">Entre na sua conta</p>
      </div>

      <div class="space-y-2">
        <label for="email" class="text-sm text-slate-200">E-mail</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="seu@email.com"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
        />
      </div>

      <div class="space-y-2">
        <label for="senha" class="text-sm text-slate-200">Senha</label>
        <input
          id="senha"
          v-model="senha"
          type="password"
          placeholder="Digite sua senha"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
        />
      </div>

      <button
        type="submit"
        class="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
      >
        Entrar
      </button>
    </form>
  </main>
</template>
