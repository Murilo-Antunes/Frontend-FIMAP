import type { RouteRecordRaw } from 'vue-router'

/**
 * Rotas do simulador. Devem entrar como `children` do MainLayout (que já define
 * requiresAuth + requiresConnection para toda a área autenticada):
 *
 *   children: [ ...dashboardRoutes, ...simulatorRoutes ]
 *
 * - simulations-history: lista (GET investimentos | amortizacoes conforme ?tipo=)
 * - simulator-new:       simulador em branco  → botão "Salvar Simulação"  → POST
 * - simulator-edit:      simulação existente  → botão "Salvar Alteração"  → PATCH
 */
export const simulatorRoutes: RouteRecordRaw[] = [
  {
    path: '/simulacoes',
    name: 'simulations-history',
    component: () => import('@/features/simulator/views/SimulationsHistoryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/simulacoes/:tipo(investimentos|amortizacoes)/nova',
    name: 'simulator-new',
    component: () => import('@/features/simulator/views/SimulatorView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/simulacoes/:tipo(investimentos|amortizacoes)/:id(\\d+)',
    name: 'simulator-edit',
    component: () => import('@/features/simulator/views/SimulatorView.vue'),
    meta: { requiresAuth: true },
  },
]
