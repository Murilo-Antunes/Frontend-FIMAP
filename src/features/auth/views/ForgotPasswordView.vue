<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import ForgotEmailStep from '../components/ForgotEmailStep.vue'

const router = useRouter()

const notice = ref('')

function onEmailSubmitted(value: { email: string; idUsuario: number }) {
  router.replace({ name: 'reset-password', params: { id: value.idUsuario } })
}
</script>

<template>
  <AuthLayout
    title="Recuperar Acesso"
    subtitle="Informe seu e-mail para redefinir sua senha."
    variant="split"
    :decor="true"
    show-header
  >
    <ForgotEmailStep :notice="notice" @submitted="onEmailSubmitted" />
  </AuthLayout>
</template>
