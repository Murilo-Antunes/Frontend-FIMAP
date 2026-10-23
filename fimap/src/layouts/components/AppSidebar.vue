<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { onKeyStroke, useScrollLock } from '@vueuse/core'
import { ChevronRight, LogOut } from 'lucide-vue-next'
import { MAIN_NAV, SIDEBAR_ID, SIDEBAR_NAV, type NavItem } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useMenuSummary } from '@/features/navigation/composables/useMenuSummary'
import { navAttrs } from './navAttrs'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  close: []
}>()

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

// Com o menu aberto, só o menu rola (o conteúdo da página fica travado)
const scrollLocked = useScrollLock(document.body)

// Descrições dinâmicas (GET /menu/resumo); atualiza ao abrir, no máximo 1x por minuto
const { descriptions, refresh: refreshSummary } = useMenuSummary()
onMounted(() => refreshSummary())

watch(
  () => props.open,
  (open) => {
    scrollLocked.value = open
    if (open) refreshSummary()
  },
)

onKeyStroke('Escape', () => {
  if (props.open) emit('close')
})

const isActive = (item: NavItem) => Boolean(item.to && route.path.startsWith(item.to))

async function onLogout() {
  emit('close')
  await auth.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 top-18 z-20 bg-black/10"
      aria-hidden="true"
      @click="emit('close')"
    />
  </Transition>

  <!-- Ocupa toda a altura da tela abaixo do header; `inert` tira os itens do foco quando fechado -->
  <aside
    :id="SIDEBAR_ID"
    aria-label="Menu lateral"
    class="fixed bottom-0 left-0 top-18 z-30 flex w-full max-w-[704px] flex-col border-r border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    v-bind="open ? {} : { inert: true }"
  >
    <nav class="flex-1 overflow-y-auto px-4 py-8 sm:px-6" aria-label="Navegação principal">
      <!-- Em telas sem espaço para as abas do header, elas viram atalhos aqui -->
      <section class="mb-8 lg:hidden">
        <p class="mb-3 px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Atalhos
        </p>
        <ul class="flex flex-col gap-1">
          <li v-for="item in MAIN_NAV" :key="item.key">
            <component
              :is="item.to ? RouterLink : 'button'"
              v-bind="navAttrs(item)"
              class="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-black"
              :class="isActive(item) ? 'bg-neutral-100' : ''"
              :aria-current="isActive(item) ? 'page' : undefined"
              @click="item.to && emit('close')"
            >
              <component :is="item.icon" :size="20" aria-hidden="true" />
              {{ item.label }}
            </component>
          </li>
        </ul>
      </section>

      <p class="mb-3 px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        Navegação principal
      </p>
      <ul class="flex flex-col gap-1.5">
        <li v-for="item in SIDEBAR_NAV" :key="item.key">
          <component
            :is="item.to ? RouterLink : 'button'"
            v-bind="navAttrs(item)"
            class="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-black"
            :class="item.highlight ? 'border border-neutral-200 bg-neutral-50 px-3' : ''"
            @click="item.to && emit('close')"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl"
              :class="item.highlight ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-900'"
            >
              <component :is="item.icon" :size="20" aria-hidden="true" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2 text-[15px] font-medium text-neutral-900">
                {{ item.label }}
                <span
                  v-if="item.badge"
                  class="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
                >
                  {{ item.badge }}
                </span>
              </span>
              <span class="mt-0.5 block truncate text-xs text-neutral-500">
                {{ descriptions[item.key] ?? item.description }}
              </span>
            </span>

            <ChevronRight :size="18" class="shrink-0 text-neutral-500" aria-hidden="true" />
          </component>
        </li>
      </ul>
    </nav>

    <div class="border-t border-neutral-200 p-4">
      <button
        type="button"
        class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-medium text-red-600 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600"
        @click="onLogout"
      >
        <LogOut :size="16" aria-hidden="true" />
        Sair
      </button>
    </div>
  </aside>
</template>
