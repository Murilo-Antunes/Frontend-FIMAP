<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ForgotEmailStep from '../components/ForgotEmailStep.vue'
import ForgotCodeStep from '../components/ForgotCodeStep.vue'
import ForgotResetStep from '../components/ForgotResetStep.vue'

type Step = 'email' | 'code' | 'reset'

const router = useRouter()

const step = ref<Step>('email')
const email = ref('')
// O token fica apenas em memória (nunca em localStorage/sessionStorage)
const resetToken = ref('')
const notice = ref('')

// Cada etapa tem uma variação de layout no design
const variant = computed(() => (step.value === 'email' ? 'split' : 'stacked'))
const showDecor = computed(() => step.value !== 'reset')

function onEmailSubmitted(value: string) {
  email.value = value
  notice.value = ''
  step.value = 'code'
}

function onCodeVerified(token: string) {
  resetToken.value = token
  step.value = 'reset'
}

function backToEmail() {
  resetToken.value = ''
  step.value = 'email'
}

function onResetExpired() {
  notice.value = 'A solicitação expirou. Informe seu e-mail para receber um novo código.'
  backToEmail()
}

function onResetDone() {
  resetToken.value = ''
  router.replace({ name: 'login', query: { reset: '1' } })
}
</script>

<template>
  <AuthLayout
    title="Recuperar Acesso"
    subtitle="Informe seus dados para redefinir sua senha com segurança."
    :variant="variant"
    :decor="showDecor"
    show-header
  >
    <ForgotEmailStep v-if="step === 'email'" :notice="notice" @submitted="onEmailSubmitted" />
    <ForgotCodeStep
      v-else-if="step === 'code'"
      :email="email"
      @verified="onCodeVerified"
      @back="backToEmail"
    />
    <ForgotResetStep
      v-else
      :email="email"
      :reset-token="resetToken"
      @done="onResetDone"
      @expired="onResetExpired"
    />
  </AuthLayout>
</template>
