<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import TextField from '@/components/shared/TextField.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { authService } from '../services/auth.service'
import { z } from 'zod'
import OtpInput from '../components/OtpInput.vue'

const router = useRouter()
const route = useRoute()
const idUsuario = Number(route.params.id)

// Etapas: 'verify-otp', 'new-password'
const step = ref<'verify-otp' | 'new-password'>('verify-otp')

const form = ref({ codigo: '', novaSenha: '', confirmarSenha: '' })

const otpSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, 'Informe os 6 dígitos do código.'),
})

const passwordSchema = z.object({
  novaSenha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não conferem.',
  path: ['confirmarSenha'],
})

// Re-cria o validador sempre que a etapa mudar
// O useZodForm precisa ser re-executado quando step mudar
import { computed } from 'vue'
const currentSchema = computed(() =>
  step.value === 'verify-otp' ? otpSchema : passwordSchema
)
const { errors, validate, clearError } = useZodForm(currentSchema)

const submitting = ref(false)
const formError = ref('')

async function onSubmit() {
  formError.value = ''

  if (step.value === 'verify-otp') {
    const data = validate(form.value)

    if (!data || !('codigo' in data)) return

    submitting.value = true

    try {
      await authService.verifyPasswordOtp(idUsuario, data.codigo)
      step.value = 'new-password'
    } catch (error) {
      formError.value = toApiError(error).mensagem
    } finally {
      submitting.value = false
    }
  } else {
    const data = validate(form.value)

    if (!data || !('novaSenha' in data)) return

    submitting.value = true

    try {
      await authService.updatePassword(idUsuario, data.novaSenha)

      await router.replace({
        name: 'login',
        query: { reset: '1' },
      })
    } catch (error) {
      formError.value = toApiError(error).mensagem
    } finally {
      submitting.value = false
    }
  }
}
</script>

<template>
  <AuthLayout 
    :title="step === 'verify-otp' ? 'Verificar Código' : 'Nova Senha'" 
    :subtitle="step === 'verify-otp' ? 'Informe o código enviado ao seu e-mail.' : 'Escolha uma nova senha para sua conta.'"
  >
    <form class="flex w-full max-w-md flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <template v-if="step === 'verify-otp'">
        <div class="rounded-xl border border-neutral-200 bg-white px-2 py-5">
          <OtpInput
            v-model="form.codigo"
            :invalid="Boolean(errors.codigo)"
            :disabled="submitting"
            @update:model-value="clearError('codigo')"
          />
        </div>
        <p v-if="errors.codigo" class="text-xs text-red-600" role="alert">
          {{ errors.codigo }}
        </p>

        <SubmitButton :loading="submitting">Verificar Código</SubmitButton>

        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
        >
          Voltar para e-mail
        </RouterLink>
      </template>

      <template v-else>
        <TextField v-model="form.novaSenha" label="Nova Senha" type="password" :error="errors.novaSenha" @update:model-value="clearError('novaSenha')" />
        <TextField v-model="form.confirmarSenha" label="Confirmar Senha" type="password" :error="errors.confirmarSenha" @update:model-value="clearError('confirmarSenha')" />
        
        <SubmitButton :loading="submitting">Redefinir Senha</SubmitButton>
        
        <RouterLink
          :to="{ name: 'login' }"
          class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
        >
          Voltar ao login
        </RouterLink>
      </template>
    </form>
  </AuthLayout>
</template>
