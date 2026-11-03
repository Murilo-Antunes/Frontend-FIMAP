<script setup lang="ts">
import { ref } from 'vue'
import TextField from '@/components/shared/TextField.vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { authService } from '../services/auth.service'
import { forgotEmailSchema } from '../schemas/auth.schemas'

defineProps<{ notice?: string }>()

const emit = defineEmits<{
  /** Emite o e-mail e o id_usuario obtido pela busca para os próximos passos. */
  submitted: [value: { email: string; idUsuario: number }]
}>()

const email = ref('')
const { errors, validate, clearError, setServerErrors } = useZodForm(forgotEmailSchema)
const submitting = ref(false)
const formError = ref('')

async function onSubmit() {
  formError.value = ''
  const data = validate({ email: email.value })
  if (!data) return

  submitting.value = true
  try {
    // Busca o usuário pelo email para obter o id_usuario
    const idUsuario = await authService.getUserIdByEmail(data.email)
    
    // Solicita o envio do código OTP para o email
    await authService.forgotPassword(idUsuario)

    // Emite os dados para o próximo passo
    emit('submitted', { email: data.email, idUsuario })
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
  <form class="flex w-full max-w-md flex-col gap-4" novalidate @submit.prevent="onSubmit">
    <FormAlert v-if="notice">{{ notice }}</FormAlert>
    <FormAlert v-if="formError">{{ formError }}</FormAlert>

    <div class="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <TextField
        v-model="email"
        label="Email"
        type="email"
        placeholder="seu@email.com"
        autocomplete="email"
        inputmode="email"
        :error="errors.email"
        @update:model-value="clearError('email')"
      />
    </div>

    <SubmitButton :loading="submitting">Confirmar Email</SubmitButton>

    <RouterLink
      :to="{ name: 'login' }"
      class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
    >
      Cancelar e voltar ao login
    </RouterLink>
  </form>
</template>
