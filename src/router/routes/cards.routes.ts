import type { RouteRecordRaw } from 'vue-router'

/**
 * Rotas de cartões. Registrar como FILHAS do MainLayout para herdar
 * `requiresAuth + requiresConnection`:
 *
 *   { path: '/', component: MainLayout, meta: {...}, children: [ ...cardsRoutes, ... ] }
 */
export const cardsRoutes: RouteRecordRaw[] = [
  {
    path: '/cartoes',
    name: 'cards',
    component: () => import('@/features/cards/views/CardsSelectView.vue'),
  },
  {
    path: '/cartoes/:cartaoId',
    name: 'card-detail',
    component: () => import('@/features/cards/views/CardDetailView.vue'),
    props: true,
  },
]
