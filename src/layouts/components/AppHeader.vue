<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { Bell, Menu, UserRound, X } from 'lucide-vue-next'
import BrandLogo from '@/components/shared/BrandLogo.vue'
import { MAIN_NAV, SIDEBAR_NAV, SIDEBAR_ID, type NavItem } from '@/config/navigation'
import { navAttrs } from './navAttrs'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificacoesStore } from '@/stores/notificacoes.store'
import { useSocialProfileStore } from '@/stores/social-profile.store'

defineProps<{ sidebarOpen: boolean }>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const route = useRoute()
const authStore = useAuthStore()
const notificacoesStore = useNotificacoesStore()
const socialProfileStore = useSocialProfileStore()

const isSidebarRoute = computed(() => {
  return SIDEBAR_NAV.some(item => item.to && route.path.startsWith(item.to))
})

const isActive = (item: NavItem) => {
  if (item.key === 'home' && isSidebarRoute.value) {
    return true
  }
  return Boolean(item.to && route.path.startsWith(item.to))
}

const badgeNaoLidas = computed(() =>
  notificacoesStore.naoLidas > 9 ? '9+' : String(notificacoesStore.naoLidas),
)

// NOVO: ícone de perfil só aparece dentro da área "Social".
// ⚠️ Ajuste o prefixo abaixo se o path real das communityRoutes não for
// "/comunidade" (confira em src/router/routes/community.routes.ts).
const isSocialSection = computed(() => route.path.startsWith('/comunidade'))

onMounted(() => {
  if (authStore.isAuthenticated) {
    notificacoesStore.atualizarContagem(authStore.usuario?.id??0)
  }
})
</script>

<template>
  <!-- Fixo no topo, com transparência + blur para o conteúdo "aparecer" por trás ao rolar -->
  <header
    class="fixed inset-x-0 top-0 z-40 h-18 border-b border-neutral-200/60 bg-white/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70"
  >
    <div
      class="relative mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-[60px]"
    >
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black"
          :aria-label="sidebarOpen ? 'Fechar menu' : 'Abrir menu'"
          :aria-expanded="sidebarOpen"
          :aria-controls="SIDEBAR_ID"
          @click="emit('toggle-sidebar')"
        >
          <X v-if="sidebarOpen" :size="22" />
          <Menu v-else :size="22" />
        </button>

        <RouterLink
          to="/dashboard"
          class="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-black"
          aria-label="Fimap — ir para o início"
        >
          <BrandLogo :size="32" shape="rounded" />
          <span class="text-base font-bold">Fimap</span>
        </RouterLink>
      </div>

      <nav
        class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
        aria-label="Seções do aplicativo"
      >
        <component
          :is="item.to ? RouterLink : 'button'"
          v-for="item in MAIN_NAV"
          :key="item.key"
          v-bind="navAttrs(item)"
          class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-black"
          :class="
            isActive(item) ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
          "
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />
          {{ item.label }}
        </component>
      </nav>

      <div class="flex items-center gap-1">
        <!-- NOVO: só aparece dentro da área Social; leva ao próprio perfil (Perfil Comunidade). -->
        <RouterLink
          v-if="isSocialSection && socialProfileStore.hasSocialProfile()"
          :to="{ name: 'community-profile' }"
          class="rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black"
          aria-label="Meu perfil na comunidade"
        >
          <UserRound :size="20" />
        </RouterLink>

        <RouterLink
          :to="{ name: 'notificacoes' }"
          class="relative rounded-lg p-2 text-neutral-900 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black"
          aria-label="Notificações"
        >
          <Bell :size="20" />
          <span
            v-if="notificacoesStore.naoLidas > 0"
            class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
          >
            {{ badgeNaoLidas }}
          </span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>
