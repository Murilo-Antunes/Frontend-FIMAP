<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Lock, Mail } from 'lucide-vue-next'
import AuthLayout from '@/layouts/AuthLayout.vue'
import TextField from '@/components/shared/TextField.vue'
import SubmitButton from '@/components/shared/SubmitButton.vue'
import FormAlert from '@/components/shared/FormAlert.vue'
import { useZodForm } from '@/composables/useZodForm'
import { toApiError } from '@/lib/api/types/api-error'
import { useAuthStore } from '@/stores/auth.store'
import { loginSchema } from '../schemas/auth.schemas'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', senha: '' })
const { errors, validate, clearError, setServerErrors } = useZodForm(loginSchema)
const submitting = ref(false)
const formError = ref('')

// Mensagens vindas de outros fluxos (cadastro e redefinição de senha)
const notice = computed(() => {
  if (route.query.registered) return 'Conta criada e verificada! Faça login para continuar.'
  if (route.query.reset) return 'Senha redefinida com sucesso! Faça login com a nova senha.'
  return ''
})

async function onSubmit() {
  formError.value = ''
  const data = validate(form)
  if (!data) return

  submitting.value = true
  try {
    await auth.login(data)
    // Não redireciona diretamente - deixa o router e os guards decidirem
    // O connectionGuard vai verificar se tem conexão e redirecionar adequadamente
    await router.push({ name: 'dashboard' })
  } catch (error) {
    const apiError = toApiError(error)
    formError.value = apiError.mensagem
    setServerErrors(apiError.campos)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Bem-vindo(a)" subtitle="Acesse sua conta para continuar">
    <form
      class="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormAlert v-if="notice" variant="success">{{ notice }}</FormAlert>
      <FormAlert v-if="formError">{{ formError }}</FormAlert>

      <TextField
        v-model="form.email"
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        autocomplete="email"
        inputmode="email"
        :error="errors.email"
        @update:model-value="clearError('email')"
      >
        <template #icon><Mail :size="20" /></template>
      </TextField>

      <div class="flex flex-col gap-2">
        <TextField
          v-model="form.senha"
          label="Senha"
          type="password"
          placeholder="Sua senha"
          autocomplete="current-password"
          revealable
          :error="errors.senha"
          @update:model-value="clearError('senha')"
        >
          <template #icon><Lock :size="20" /></template>
        </TextField>

        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="w-fit text-xs font-medium text-neutral-900 hover:underline"
        >
          Esqueci minha senha
        </RouterLink>
      </div>

      <SubmitButton :loading="submitting">
        Entrar <ArrowRight :size="18" aria-hidden="true" />
      </SubmitButton>

      <p class="border-t border-neutral-200 pt-5 text-center text-sm text-neutral-600">
        Não tem uma conta?
        <RouterLink :to="{ name: 'register' }" class="font-medium text-black hover:underline">
          Cadastre-se
        </RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>
