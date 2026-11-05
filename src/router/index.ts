import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards/auth.guard'
import { connectionGuard } from './guards/connection.guard'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    /** Exige ao menos uma conta bancária conectada (senão vai para /conectar-banco). */
    requiresConnection?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/cadastro',
      name: 'register',
      component: () => import('@/features/auth/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/recuperar-senha',
      name: 'forgot-password',
      component: () => import('@/features/auth/views/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/redefinir-senha/:id',
      name: 'reset-password',
      component: () => import('@/features/auth/views/ResetPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      // Verificação OTP após o cadastro (?id=...&email=...).
      path: '/verificar-email',
      name: 'verify-otp',
      component: () => import('@/features/auth/views/VerifyOtpView.vue'),
    },
    {
      // Conexão do banco (Open Finance): exige login, mas não exige conexão prévia.
      path: '/conectar-banco',
      name: 'connect-bank',
      component: () => import('@/features/connection/views/ConnectBankView.vue'),
      meta: { requiresAuth: true },
    },
    {
      // Área autenticada: header, menu lateral e footer ficam no MainLayout.
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true, requiresConnection: true },
      children: [
        { path: '', redirect: { name: 'dashboard' } },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/features/dashboard/views/DashboardView.vue'),
          meta: { requiresAuth: true, requiresConnection: true },
        },
        // Novas rotas integradas do Núcleo Financeiro e Transações
        {
          path: 'nucleo-financeiro',
          name: 'nucleo-financeiro',
          component: () => import('@/features/dashboard/views/NucleoFinanceiroView.vue'),
          meta: { requiresAuth: true, requiresConnection: true },
        },
        {
          path: 'transacoes',
          name: 'transacoes',
          component: () => import('@/features/dashboard/views/TodasTransacoesView.vue'),
          meta: { requiresAuth: true, requiresConnection: true },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'dashboard' } },
  ],
})

router.beforeEach(authGuard)
router.beforeEach(connectionGuard)