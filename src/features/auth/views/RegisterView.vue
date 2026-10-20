<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Contact, Lock, Mail, User } from 'lucide-vue-next'
import AuthLayout from '@/layouts/AuthLayout.vue'
import TextField from '@/components/shared/TextField.vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { formatCpf, onlyDigits } from '@/lib/cpf'
import { authService } from '../services/auth.service'
import { registerSchema } from '../schemas/auth.schemas'

const router = useRouter()

const form = reactive({ nome: '', cpf: '', email: '', username: '', senha: '' })
const { errors, validate, clearError, setServerErrors } = useZodForm(registerSchema)
const submitting = ref(false)
const formError = ref('')

function onCpfInput(value: string) {
  form.cpf = formatCpf(value)
  clearError('cpf')
}

async function onSubmit() {
  formError.value = ''
  const data = validate(form)
  if (!data) return

  submitting.value = true
  try {
    // A API recebe o CPF apenas com dígitos
    await authService.register({ ...data, cpf: onlyDigits(data.cpf) })
    await router.replace({ name: 'login', query: { registered: '1' } })
  } catch (error) {
    const apiError = toApiError(error)
    formError.value = apiError.campos ? '' : apiError.mensagem
    setServerErrors(apiError.campos)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Crie sua conta" subtitle="Cadastre-se para acessar o Fimap.">
    <form
      class="grid w-full max-w-2xl grid-cols-1 gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormAlert v-if="formError" class="sm:col-span-2">{{ formError }}</FormAlert>

      <TextField
        v-model="form.nome"
        label="Nome Completo"
        placeholder="Seu nome completo"
        autocomplete="name"
        :error="errors.nome"
        @update:model-value="clearError('nome')"
      >
        <template #icon><User :size="20" /></template>
      </TextField>

      <TextField
        :model-value="form.cpf"
        label="CPF"
        placeholder="000.000.000-00"
        inputmode="numeric"
        :error="errors.cpf"
        @update:model-value="onCpfInput"
      >
        <template #icon><Contact :size="20" /></template>
      </TextField>

      <TextField
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="seu@email.com"
        autocomplete="email"
        inputmode="email"
        :error="errors.email"
        @update:model-value="clearError('email')"
      >
        <template #icon><Mail :size="20" /></template>
      </TextField>

      <TextField
        v-model="form.username"
        label="Username"
        placeholder="nome de usuário"
        autocomplete="username"
        :error="errors.username"
        @update:model-value="clearError('username')"
      >
        <template #icon><User :size="20" /></template>
      </TextField>

      <div class="sm:col-span-2">
        <TextField
          v-model="form.senha"
          label="Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          autocomplete="new-password"
          revealable
          :error="errors.senha"
          @update:model-value="clearError('senha')"
        >
          <template #icon><Lock :size="20" /></template>
        </TextField>
      </div>

      <div class="flex flex-col gap-4 sm:col-span-2">
        <SubmitButton :loading="submitting">
          Cadastrar <ArrowRight :size="18" aria-hidden="true" />
        </SubmitButton>

        <p class="text-center text-sm text-neutral-600">
          Já tem uma conta?
          <RouterLink :to="{ name: 'login' }" class="font-medium underline hover:text-black">
            Fazer Login
          </RouterLink>
        </p>
      </div>
    </form>
  </AuthLayout>
</template>
