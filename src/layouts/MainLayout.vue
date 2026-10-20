<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()
const sidebarOpen = ref(false)

// Navegar para outra tela fecha o menu
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#f7f7f8] text-neutral-900">
    <AppHeader :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- pt-18 = altura do header fixo -->
    <main class="flex-1 pt-18">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>
