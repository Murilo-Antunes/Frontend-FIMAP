import type { RouteRecordRaw } from 'vue-router'

// Rotas da feature de Metas Financeiras.
// Atenção à ordem: 'metas/nova' (estática) precisa vir antes de 'metas/:id' (dinâmica),
// senão o router tentaria casar "nova" como se fosse o :id.
export const metasRoutes: RouteRecordRaw[] = [
  {
    path: 'metas',
    name: 'metas',
    component: () => import('@/features/metas/views/MetasListView.vue'),
    meta: { requiresAuth: true, requiresConnection: true },
  },
  {
    path: 'metas/nova',
    name: 'metas-criar',
    component: () => import('@/features/metas/views/MetaCreateView.vue'),
    meta: { requiresAuth: true, requiresConnection: true },
  },
  {
    path: 'metas/:id',
    name: 'metas-editar',
    component: () => import('@/features/metas/views/MetaEditView.vue'),
    meta: { requiresAuth: true, requiresConnection: true },
  },
]
