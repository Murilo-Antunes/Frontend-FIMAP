
import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../features/auth/views/LoginView.vue'
import DashboardView from '../features/dashboard/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
  ],
})

export default router
