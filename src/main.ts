import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// A ordem importa: o Pinia precisa estar ativo antes do router (o guard usa a store).
app.use(pinia)
app.use(router)
app.mount('#app')
