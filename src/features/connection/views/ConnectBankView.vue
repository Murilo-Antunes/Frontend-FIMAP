<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Loader2, Lock } from 'lucide-vue-next'
import FormAlert from '@/components/shared/FormAlert.vue'
import { env } from '@/config/env'
import FlowLayout from '@/layouts/FlowLayout.vue'
import { toApiError } from '@/lib/api/types/api-error'
import { loadPluggyConnect, type PluggyConnectInstance } from '@/lib/pluggy/pluggy-connect'
import { useAuthStore } from '@/stores/auth.store'
import { useConnectionStore } from '@/stores/connection.store'
import { connectionService } from '../services/connection.service'

type Step = 'idle' | 'token' | 'widget' | 'saving'

const router = useRouter()
const auth = useAuthStore()
const connection = useConnectionStore()

const step = ref<Step>('idle')
const errorMessage = ref('')
/** Item criado no widget cujo registro no backend falhou (permite tentar de novo sem refazer o login no banco). */
const pendingItemId = ref<string | null>(null)
/** consentId retornado pelo Pluggy Connect */
const pendingConsentId = ref<string | null>(null)

let widget: PluggyConnectInstance | null = null

const busy = computed(() => step.value !== 'idle')
const buttonLabel = computed(() => {
  if (step.value === 'token') return 'Preparando conexão…'
  if (step.value === 'widget') return 'Conexão em andamento…'
  if (step.value === 'saving') return 'Salvando conexão…'
  return pendingItemId.value ? 'Tentar salvar novamente' : 'Conectar'
})

/** Registra o item no backend e segue para o dashboard. */
async function saveItem(itemId: string, consentId: string) {
  if (!auth.usuario) return
  step.value = 'saving'
  errorMessage.value = ''
  try {
    console.log('ConnectBankView - Salvando conexão:', { itemId, consentId })
    const saved = await connectionService.saveConnection(auth.usuario.id, consentId, itemId)
    console.log('ConnectBankView - Conexão salva:', saved)
    connection.add(saved)
    console.log('ConnectBankView - Estado da store após add:', {
      status: connection.status,
      hasConnection: connection.hasConnection,
      connections: connection.connections
    })
    pendingItemId.value = null
    pendingConsentId.value = null
    console.log('ConnectBankView - Redirecionando para dashboard...')
    await router.replace({ name: 'dashboard' })
  } catch (error) {
    console.error('ConnectBankView - Erro ao salvar conexão:', error)
    pendingItemId.value = itemId
    pendingConsentId.value = consentId
    errorMessage.value = `Sua conta foi conectada, mas não conseguimos salvar a conexão. ${toApiError(error).mensagem}`
    step.value = 'idle'
  }
}

async function onConnect() {
  if (busy.value || !auth.usuario) return

  // Conexão já feita, só faltou salvar
  if (pendingItemId.value && pendingConsentId.value) {
    await saveItem(pendingItemId.value, pendingConsentId.value)
    return
  }

  errorMessage.value = ''
  step.value = 'token'
  try {
    const connectToken = await connectionService.createConnectToken(auth.usuario.id)
    const PluggyConnect = await loadPluggyConnect()

    widget?.destroy?.()
    widget = new PluggyConnect({
      connectToken,
      includeSandbox: env.pluggyIncludeSandbox,
      onSuccess: ({ item }) => {
        console.log('Pluggy Connect - Retorno completo:', { item })
        const consentId = item.consentId || item.id
        console.log('Pluggy Connect - item.id:', item.id)
        console.log('Pluggy Connect - item.consentId:', item.consentId)
        console.log('Pluggy Connect - consentId usado:', consentId)
        saveItem(item.id, consentId)
      },
      onError: () => {
        errorMessage.value = 'Não foi possível concluir a conexão com o banco. Tente novamente.'
        step.value = 'idle'
      },
      // Fechar o widget sem concluir devolve o botão (se já houve sucesso, o passo é "saving")
      onClose: () => {
        if (step.value === 'widget') step.value = 'idle'
      },
    })

    step.value = 'widget'
    await widget.init()
  } catch (error) {
    errorMessage.value = toApiError(error).mensagem
    step.value = 'idle'
  }
}

/** Com conta conectada volta ao app; sem conta, não há para onde ir: encerra a sessão. */
async function onCancel() {
  if (step.value === 'saving') return
  if (connection.hasConnection) {
    await router.replace({ name: 'dashboard' })
    return
  }
  await auth.logout()
  await router.replace({ name: 'login' })
}

onBeforeUnmount(() => widget?.destroy?.())
</script>

<template>
  <FlowLayout back-label="Cancelar e voltar" @back="onCancel">
    <section class="flex w-full max-w-[600px] flex-col items-center text-center" aria-labelledby="connect-title">
      <h1 id="connect-title" class="text-3xl font-bold tracking-tight">Conecte seu Banco</h1>
      <p class="mt-3 text-base text-neutral-600">
        Vincule sua conta para sincronizar suas finanças via Open Finance de forma segura.
      </p>

      <div
        class="mt-8 flex w-full max-w-[376px] items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left"
      >
        <Lock :size="20" class="mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <h2 class="text-sm font-semibold">Ambiente Seguro</h2>
          <p class="mt-1 text-xs leading-relaxed text-neutral-600">
            Seus dados estão protegidos por criptografia de ponta a ponta. Ao conectar, você consente com
            os termos de compartilhamento de dados do Open Finance regulamentado pelo Banco Central.
          </p>
        </div>
      </div>

      <div class="mt-6 flex w-full max-w-[376px] flex-col gap-3">
        <FormAlert v-if="errorMessage" class="text-left">{{ errorMessage }}</FormAlert>

        <button
          type="button"
          class="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-black px-6 text-base font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="busy"
          :aria-busy="busy"
          @click="onConnect"
        >
          <Loader2 v-if="busy" class="animate-spin motion-reduce:animate-none" :size="18" aria-hidden="true" />
          {{ buttonLabel }}
          <ArrowRight v-if="!busy" :size="18" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="h-[50px] w-full rounded-xl border border-neutral-200 bg-white text-sm font-medium transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="step === 'saving'"
          @click="onCancel"
        >
          Cancelar
        </button>
      </div>
    </section>
  </FlowLayout>
</template>
