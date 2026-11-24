import type { RouteRecordRaw } from 'vue-router'

/**
 * Rotas da comunidade. Devem entrar como `children` do MainLayout (herdam
 * requiresAuth + requiresConnection do pai):
 *
 *   children: [ ...dashboardRoutes, ...communityRoutes ]
 *
 * O item "Social" do header aponta para `{ name: 'community' }`; o socialProfileGuard
 * redireciona para `community-profile` quando o usuário ainda não criou o perfil social.
 */
export const communityRoutes: RouteRecordRaw[] = [
  {
    path: '/comunidade',
    name: 'community',
    component: () => import('@/features/community/views/CommunityHomeView.vue'),
    meta: { requiresSocialProfile: true },
  },
  {
    path: '/comunidade/perfil/editar',
    name: 'community-profile-edit',
    component: () => import('@/features/community/views/SocialProfileEditView.vue'),
    meta: { showBack: true },
  },
  {
    path: '/comunidade/post/:id(\\d+)',
    name: 'community-post',
    component: () => import('@/features/community/views/CommunityPostView.vue'),
    props: (route) => ({ postId: Number(route.params.id) }),
    meta: { requiresSocialProfile: true, showBack: true },
  },
  {
    // Mesma tela para denunciar post e perfil: o `tipo` na URL decide a rota do backend.
    path: '/comunidade/denunciar/:tipo(post|perfil)/:id(\\d+)',
    name: 'community-report',
    component: () => import('@/features/community/views/CommunityReportView.vue'),
    props: (route) => ({ tipo: route.params.tipo as 'post' | 'perfil', id: Number(route.params.id) }),
    meta: { requiresSocialProfile: true, showBack: true },
  },
  {
    path: 'comunidade/configuracoes',
    name: 'community-settings',
    component: () => import('@/features/community/views/SocialSettingsView.vue'),
  },
]
