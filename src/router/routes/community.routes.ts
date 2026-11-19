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
    path: '/comunidade/perfil',
    name: 'community-profile',
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
]
