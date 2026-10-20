import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { http } from '@/lib/api/http'
import { setupAuthInterceptor } from '@/lib/api/interceptors/auth.interceptor'
import { useAuthStore } from '@/stores/auth.store'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// A ordem importa: o Pinia precisa estar ativo antes do router (o guard usa a store).
app.use(pinia)

// Quando a renovação da sessão falha: limpa o estado e vai para o login se a rota exigir sessão.
setupAuthInterceptor(http, {
  onSessionExpired: () => {
    useAuthStore().clearSession()
    const current = router.currentRoute.value
    if (current.meta.requiresAuth) {
      router.replace({ name: 'login', query: { redirect: current.fullPath } })
    }
  },
})

app.use(router)
app.mount('#app')
