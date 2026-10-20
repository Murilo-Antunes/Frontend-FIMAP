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
  submitted: [email: string]
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
    const response = await authService.forgotPassword(data.email)
    // Apenas em desenvolvimento: sem provedor de e-mail, o código chega na resposta da API mock.
    if (import.meta.env.DEV && response.codigo_dev) {
      console.info('[DEV] Código de verificação:', response.codigo_dev)
    }
    emit('submitted', data.email)
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

    <SubmitButton :loading="submitting">Confirma Email</SubmitButton>

    <RouterLink
      :to="{ name: 'login' }"
      class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
    >
      Cancelar e voltar ao login
    </RouterLink>
  </form>
</template>
