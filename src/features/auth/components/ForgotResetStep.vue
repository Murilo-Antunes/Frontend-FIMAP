<script setup lang="ts">
import { reactive, ref } from 'vue'
import TextField from '@/components/shared/TextField.vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { authService } from '../services/auth.service'
import { resetPasswordSchema } from '../schemas/auth.schemas'

const props = defineProps<{ email: string; resetToken: string }>()

const emit = defineEmits<{
  done: []
  /** O token de redefinição expirou/é inválido: o fluxo precisa recomeçar. */
  expired: []
}>()

const form = reactive({ novaSenha: '', confirmarSenha: '' })
const { errors, validate, clearError, setServerErrors } = useZodForm(resetPasswordSchema)
const submitting = ref(false)
const formError = ref('')

async function onSubmit() {
  formError.value = ''
  const data = validate(form)
  if (!data) return

  submitting.value = true
  try {
    await authService.resetPassword({
      email: props.email,
      reset_token: props.resetToken,
      nova_senha: data.novaSenha,
    })
    emit('done')
  } catch (error) {
    const apiError = toApiError(error)
    if (apiError.codigo === 'TOKEN_INVALIDO') {
      emit('expired')
      return
    }
    formError.value = apiError.campos ? '' : apiError.mensagem
    // A API usa o nome do campo em snake_case
    if (apiError.campos?.nova_senha) setServerErrors({ novaSenha: apiError.campos.nova_senha })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="flex w-full max-w-lg flex-col gap-5" novalidate @submit.prevent="onSubmit">
    <FormAlert v-if="formError">{{ formError }}</FormAlert>

    <div class="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <TextField
        v-model="form.novaSenha"
        label="Nova Senha"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
        :error="errors.novaSenha"
        @update:model-value="clearError('novaSenha')"
      />
      <TextField
        v-model="form.confirmarSenha"
        label="Confirmar Nova Senha"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
        :error="errors.confirmarSenha"
        @update:model-value="clearError('confirmarSenha')"
      />
    </div>

    <SubmitButton :loading="submitting" class="mx-auto sm:max-w-sm">Redefinir Senha</SubmitButton>

    <RouterLink
      :to="{ name: 'login' }"
      class="text-center text-sm text-neutral-600 hover:text-black hover:underline"
    >
      Cancelar e voltar ao login
    </RouterLink>
  </form>
</template>
