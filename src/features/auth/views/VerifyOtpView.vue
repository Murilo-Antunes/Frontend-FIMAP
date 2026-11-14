<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '../services/auth.service'
import { otpSchema } from '../schemas/auth.schemas'
import OtpInput from '../components/OtpInput.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isVerified = ref(false)

// id_usuario e email chegam via query string após o cadastro
const idUsuario = Number(route.query.id)
const email = String(route.query.email ?? '')
const senha = String(route.query.senha ?? '')

// Se a query estiver incompleta, redireciona para o cadastro
if (!idUsuario || !email || !senha) {
  router.replace({ name: 'register' })
}

onBeforeRouteLeave(async () => {
  if (!isVerified.value) {
    try {
      await authService.deleteUsuario(idUsuario)
    } catch (error) {
      console.error('Falha ao deletar usuário:', error)
    }
  }
})

const codigo = ref('')
const { errors, validate, clearError } = useZodForm(otpSchema)
const submitting = ref(false)
const formError = ref('')

async function onSubmit() {
  formError.value = ''
  const data = validate({ codigo: codigo.value })
  if (!data) return

  submitting.value = true
  try {
    await authService.verifyRegisterOtp(idUsuario, data.codigo)
    isVerified.value = true
    // OTP válido: faz login automático e redireciona para conectar banco
    await auth.login({ email, senha })
    await router.replace({ name: 'connect-bank' })
  } catch (error) {
    formError.value = toApiError(error).mensagem
    codigo.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    title="Verifique seu e-mail"
    subtitle="Enviamos um código de 6 dígitos para confirmar seu cadastro."
  >
    <form
      class="flex w-full max-w-md flex-col items-stretch gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <div>
        <p class="mb-1 text-sm font-medium text-neutral-800">Código de Verificação</p>
        <p class="mb-4 text-xs text-neutral-500">
          Código enviado para <span class="font-medium">{{ email }}</span>.
        </p>

        <div class="rounded-xl border border-neutral-200 px-2 py-5">
          <OtpInput
            v-model="codigo"
            :invalid="Boolean(errors.codigo)"
            :disabled="submitting"
            @update:model-value="clearError('codigo')"
          />
        </div>
        <p v-if="errors.codigo" class="mt-2 text-xs text-red-600" role="alert">
          {{ errors.codigo }}
        </p>
      </div>

      <SubmitButton :loading="submitting">Verificar e continuar</SubmitButton>

      <RouterLink
        :to="{ name: 'register' }"
        class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
      >
        Voltar ao cadastro
      </RouterLink>
    </form>
  </AuthLayout>
</template>
