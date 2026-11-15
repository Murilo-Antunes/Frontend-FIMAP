import type { RouteRecordRaw } from 'vue-router'

export const simulatorRoutes: RouteRecordRaw[] = [
  {
    path: '/simulacoes',
    name: 'simulations-history',
    component: () => import('@/features/simulator/views/SimulationsHistoryView.vue'),
  },
  {
    path: '/simulacoes/:tipo(investimentos|amortizacoes)/nova',
    name: 'simulator-new',
    component: () => import('@/features/simulator/views/SimulatorView.vue'),
  },
  {
    path: '/simulacoes/:tipo(investimentos|amortizacoes)/:id(\\d+)',
    name: 'simulator-edit',
    component: () => import('@/features/simulator/views/SimulatorView.vue'),
  },
]
