<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-vue-next'

import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { useAuthStore } from '@/stores/auth.store'
import { PASSWORD_MAX, PASSWORD_MIN, currentPasswordSchema } from '../schemas/password.schemas'
import { passwordService } from '../services/password.service'

const router = useRouter()
const authStore = useAuthStore()

const senhaAtual = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const { errors, validate, clearError, clearErrors, setServerErrors } = useZodForm(currentPasswordSchema)

const errorId = 'senha-atual-erro'
const hasError = computed(() => errors.senhaAtual !== undefined)

function onInput(): void {
  clearError('senhaAtual')
  formError.value = null
}

async function submit(): Promise<void> {
  if (submitting.value) return
  clearErrors()
  formError.value = null

  const data = validate({ senhaAtual: senhaAtual.value })
  if (!data) return

  const usuario = authStore.usuario
  const email = usuario?.email
  if (!email) {
    formError.value = 'Não foi possível identificar sua conta. Entre novamente e tente de novo.'
    return
  }

  submitting.value = true
  try {
    const ok = await passwordService.verifyCurrentPassword(email, data.senhaAtual)
    if (!ok) {
      setServerErrors({ senhaAtual: 'Senha atual incorreta.' })
      return
    }
    senhaAtual.value = '' // não deixa a senha em memória além do necessário
    await router.push({ name: 'reset-password', params: { id: String(usuario.id) } })
  } catch (e) {
    formError.value = toApiError(e).mensagem
  } finally {
    submitting.value = false
  }
}

function forgotPassword(): void {
  void router.push({ name: 'forgot-password' })
}

function cancel(): void {
  void router.push({ name: 'configuracoes' })
}
</script>

<template>
  <main class="mx-auto w-full max-w-[1200px] px-6 py-10">
    <header class="mb-10">
      <nav aria-label="Você está em" class="text-xs text-neutral-500">
        <RouterLink :to="{ name: 'configuracoes' }" class="hover:underline">Configurações</RouterLink>
        <span class="mx-2" aria-hidden="true">/</span>
        <span>Segurança da Conta</span>
      </nav>
      <h1 class="mt-1 text-xl font-bold text-neutral-900">Alterar Senha</h1>
    </header>

    <section class="mx-auto w-full max-w-[580px] rounded-[28px] border border-neutral-200 bg-white px-12 py-12 shadow-sm">
      <div class="flex flex-col items-center text-center">
        <div class="grid size-20 place-items-center rounded-full bg-neutral-100">
          <div class="relative grid size-14 place-items-center rounded-full bg-neutral-950 text-white">
            <LockKeyhole class="size-6" aria-hidden="true" />
            <span class="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-white text-neutral-950">
              <ShieldCheck class="size-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>

        <h2 class="mt-8 text-3xl font-bold tracking-tight text-neutral-950">Confirmar Senha Atual</h2>
        <p class="mt-3 max-w-[460px] text-sm leading-relaxed text-neutral-500">
          Para sua segurança e proteção dos seus dados bancários e investimentos, confirme sua senha de
          acesso atual antes de definir uma nova.
        </p>
      </div>

      <form class="mt-10" novalidate @submit.prevent="submit">
        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div class="flex items-center justify-between">
            <label for="senha-atual" class="text-xs font-bold uppercase tracking-wide text-neutral-900">
              Senha atual
            </label>
            <span class="text-xs text-neutral-500">{{ PASSWORD_MIN }} a {{ PASSWORD_MAX }} caracteres</span>
          </div>

          <div
            class="mt-3 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-neutral-900"
            :class="hasError ? 'border-red-400' : 'border-neutral-200'"
          >
            <KeyRound class="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
            <input
              id="senha-atual"
              v-model="senhaAtual"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :maxlength="PASSWORD_MAX"
              :disabled="submitting"
              :aria-invalid="hasError"
              :aria-describedby="hasError ? errorId : undefined"
              placeholder="Digite sua senha cadastrada"
              class="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              @input="onInput"
            />
            <button
              type="button"
              class="shrink-0 text-neutral-400 transition hover:text-neutral-700"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="size-4" aria-hidden="true" />
              <Eye v-else class="size-4" aria-hidden="true" />
            </button>
          </div>

          <p v-if="errors.senhaAtual" :id="errorId" role="alert" class="mt-2 text-xs text-red-600">
            {{ errors.senhaAtual }}
          </p>

          <div class="mt-4 text-center">
            <button type="button" class="text-xs font-medium text-neutral-900 hover:underline" @click="forgotPassword">
              Esqueceu sua senha atual? Redefinir via código
            </button>
          </div>
        </div>

        <p v-if="formError" role="alert" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ formError }}
        </p>

        <button
          type="submit"
          :disabled="submitting"
          class="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-wait disabled:opacity-70"
        >
          <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
          <template v-if="submitting">Verificando...</template>
          <template v-else>Continuar para Nova Senha <span aria-hidden="true">→</span></template>
        </button>

        <button
          type="button"
          class="mt-5 block w-full text-center text-sm text-neutral-500 transition hover:text-neutral-900"
          @click="cancel"
        >
          Cancelar e Voltar para Configurações
        </button>
      </form>
    </section>

    <p class="mt-8 text-center text-xs text-neutral-500">Ambiente seguro com criptografia de ponta a ponta</p>
  </main>
</template>
