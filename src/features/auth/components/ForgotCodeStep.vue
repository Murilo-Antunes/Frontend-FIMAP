<script setup lang="ts">
import { ref } from 'vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { authService } from '../services/auth.service'
import { otpSchema } from '../schemas/auth.schemas'
import OtpInput from './OtpInput.vue'

const props = defineProps<{ email: string }>()

const emit = defineEmits<{
  verified: [resetToken: string]
  back: []
}>()

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
    const resetToken = await authService.verifyOtp(props.email, data.codigo)
    emit('verified', resetToken)
  } catch (error) {
    formError.value = toApiError(error).mensagem
    codigo.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="flex w-full max-w-lg flex-col items-stretch gap-5" novalidate @submit.prevent="onSubmit">
    <FormAlert v-if="formError">{{ formError }}</FormAlert>

    <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p class="mb-2 text-sm font-medium text-neutral-800">Código de Verificação</p>
      <div class="rounded-xl border border-neutral-200 px-2 py-5">
        <OtpInput
          v-model="codigo"
          :invalid="Boolean(errors.codigo)"
          :disabled="submitting"
          @update:model-value="clearError('codigo')"
        />
      </div>
      <p v-if="errors.codigo" class="mt-2 text-xs text-red-600" role="alert">{{ errors.codigo }}</p>
      <p class="mt-3 text-xs text-neutral-500">Enviamos um código para {{ email }}.</p>
    </div>

    <SubmitButton :loading="submitting" class="mx-auto sm:max-w-sm">Enviar Código</SubmitButton>

    <button
      type="button"
      class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
      @click="emit('back')"
    >
      Cancelar e voltar à seleção de email
    </button>
  </form>
</template>
