<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  ChevronRight,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth.store'
import { useConnectionStore } from '@/stores/connection.store'
import OpenFinanceCard from '../components/OpenFinanceCard.vue'
import SettingToggleRow from '../components/SettingToggleRow.vue'
import SettingsCard from '../components/SettingsCard.vue'
import { useUserSettings } from '../composables/useUserSettings'
import type { SettingKey } from '../types/settings.types'

const router = useRouter()
const authStore = useAuthStore()
const connectionStore = useConnectionStore()

const idUsuario = Number(authStore.usuario?.id)
const { settings, loading, error, load, toggle, isSaving, dismissError } = useUserSettings(idUsuario)

interface ToggleItem {
  key: SettingKey
  title: string
  description: string
}

const notificationItems: ToggleItem[] = [
  { key: 'notificacao', title: 'Notificações Push', description: 'Transações e novidades em tempo real' },
  { key: 'alerta', title: 'Alertas de Vencimento de Fatura', description: 'Avisos 3 dias antes da data limite' },
  { key: 'relatorio', title: 'Relatório Semanal Consolidado', description: 'Enviado aos domingos com fechamento' },
]

const aiHighlight: ToggleItem = {
  key: 'recomendacao',
  title: 'Recomendações da IA',
  description: 'O motor analisa gastos atípicos e aponta oportunidades de investimento personalizadas.',
}

const communityItem: ToggleItem = {
  key: 'topicos',
  title: 'Feed & Tópicos da Comunidade',
  description: 'Curadoria de discussões baseada em sua carteira',
}

const appVersion = computed(() => import.meta.env.VITE_APP_VERSION as string | undefined)

async function signOut(): Promise<void> {
  await authStore.logout()
  connectionStore.reset()
  await router.replace({ name: 'login' })
}

onMounted(load)
</script>

<template>
  <main class="mx-auto w-full max-w-[1200px] px-6 py-10">
    <header class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Configurações do Sistema</h1>
      <p class="mt-1 text-sm text-neutral-500">Preferências e Parâmetros</p>
    </header>

    <div
      v-if="error"
      role="alert"
      class="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <p>{{ error }}</p>
      <button type="button" aria-label="Fechar aviso" class="shrink-0" @click="dismissError">
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <!-- Coluna esquerda -->
      <div class="flex flex-col gap-6">
        <SettingsCard title="Segurança e Acesso" :icon="ShieldCheck">
          <!--
            Ainda não existe endpoint de troca de senha autenticada nem de 2FA
            (ver "Próximos passos" do prompt de contexto). As linhas ficam desabilitadas
            até o backend expor esses contratos.
          -->
          <div class="flex items-center gap-4 border-b border-neutral-100 py-4 opacity-70">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-neutral-100">
              <RefreshCw class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-900">Alterar Senha</p>
              <p class="mt-0.5 text-xs text-neutral-500">Redefina sua senha de acesso</p>
            </div>
            <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">Em breve</span>
            <ChevronRight class="size-4 text-neutral-400" aria-hidden="true" />
          </div>

          <div class="flex items-center gap-4 py-4 opacity-70">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-neutral-100">
              <Smartphone class="size-4" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-900">Autenticação 2FA</p>
              <p class="mt-0.5 text-xs text-neutral-500">App autenticador integrado</p>
            </div>
            <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">Em breve</span>
          </div>
        </SettingsCard>

        <OpenFinanceCard :id-usuario="idUsuario" />
      </div>

      <!-- Coluna direita -->
      <div class="flex flex-col gap-6">
        <SettingsCard title="Notificações & Alertas" :icon="Bell">
          <div v-if="loading" class="space-y-4 py-4" aria-busy="true">
            <div v-for="n in 3" :key="n" class="h-10 animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <div v-else-if="settings" class="divide-y divide-neutral-100">
            <SettingToggleRow
              v-for="item in notificationItems"
              :key="item.key"
              :title="item.title"
              :description="item.description"
              :model-value="settings[item.key]"
              :disabled="isSaving(item.key)"
              @update:model-value="(value: boolean) => toggle(item.key, value)"
            />
          </div>
        </SettingsCard>

        <SettingsCard title="Inteligência Artificial & IA" :icon="Sparkles">
          <div v-if="loading" class="space-y-4 py-4" aria-busy="true">
            <div class="h-20 animate-pulse rounded-xl bg-neutral-100" />
            <div class="h-10 animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <template v-else-if="settings">
            <div class="mt-2 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4">
              <SettingToggleRow
                :title="aiHighlight.title"
                :description="aiHighlight.description"
                :model-value="settings[aiHighlight.key]"
                :disabled="isSaving(aiHighlight.key)"
                @update:model-value="(value: boolean) => toggle(aiHighlight.key, value)"
              />
            </div>
            <SettingToggleRow
              :title="communityItem.title"
              :description="communityItem.description"
              :model-value="settings[communityItem.key]"
              :disabled="isSaving(communityItem.key)"
              @update:model-value="(value: boolean) => toggle(communityItem.key, value)"
            />
          </template>
        </SettingsCard>
      </div>
    </div>

    <div class="mt-10 flex flex-col items-center gap-4">
      <button
        type="button"
        class="flex w-full max-w-[384px] items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        @click="signOut"
      >
        <LogOut class="size-4" aria-hidden="true" />
        Sair da Conta
      </button>

      <div class="space-y-1 text-center text-xs text-neutral-400">
        <p>
          Fimap<template v-if="appVersion"> v{{ appVersion }}</template> •
          <a href="/termos-e-privacidade" class="underline">Termos e Privacidade</a>
        </p>
        <p class="flex items-center justify-center gap-1.5">
          <Lock class="size-3" aria-hidden="true" />
          Ambiente seguro com criptografia de ponta a ponta
        </p>
      </div>
    </div>
  </main>
</template>
