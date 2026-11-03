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

const router = useRouter()
const route = useRoute()
const idUsuario = Number(route.params.id)

const form = ref({ codigo: '', novaSenha: '', confirmarSenha: '' })
const schema = z.object({
  codigo: z.string().regex(/^\d{6}$/, 'Informe os 6 dígitos do código.'),
  novaSenha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não conferem.',
  path: ['confirmarSenha'],
})

const { errors, validate, clearError } = useZodForm(schema)
const submitting = ref(false)
const formError = ref('')

async function onSubmit() {
  formError.value = ''
  const data = validate(form.value)
  if (!data) return

  submitting.value = true
  try {
    await authService.resetPassword(idUsuario, data.codigo, data.novaSenha)
    await router.replace({ name: 'login', query: { reset: '1' } })
  } catch (error) {
    formError.value = toApiError(error).mensagem
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Redefinir Senha" subtitle="Informe o código enviado e sua nova senha.">
    <form class="flex w-full max-w-md flex-col gap-4" novalidate @submit.prevent="onSubmit">
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <TextField v-model="form.codigo" label="Código OTP" placeholder="000000" :error="errors.codigo" @update:model-value="clearError('codigo')" />
      <TextField v-model="form.novaSenha" label="Nova Senha" type="password" :error="errors.novaSenha" @update:model-value="clearError('novaSenha')" />
      <TextField v-model="form.confirmarSenha" label="Confirmar Senha" type="password" :error="errors.confirmarSenha" @update:model-value="clearError('confirmarSenha')" />

      <SubmitButton :loading="submitting">Redefinir Senha</SubmitButton>
    </form>
  </AuthLayout>
</template>
