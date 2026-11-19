import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { socialProfileService } from '@/features/community/services/social-profile.service'
import type { PerfilSocial } from '@/features/community/types/community.types'

/**
 * Perfil social do usuário logado (somente memória, como o restante do estado).
 * Sem endpoint de sessão, o login pode não trazer os campos sociais atualizados;
 * por isso o perfil é buscado em GET /usuario/id/:id_usuario na primeira entrada em "Social".
 */
export const useSocialProfileStore = defineStore('social-profile', () => {
  const auth = useAuthStore()

  const perfil = ref<PerfilSocial | null>(null)
  const loadedFor = ref<number | null>(null)
  let inflight: Promise<void> | null = null

  /** Perfil social completo = tem nome de exibição E username social. */
  function hasSocialProfile(): boolean {
    return Boolean(perfil.value?.nome_exibicao?.trim() && perfil.value?.username_social?.trim())
  }

  function getPerfil(): PerfilSocial {
    if (!perfil.value) throw new Error('Perfil social ainda não carregado.')
    return perfil.value
  }

  async function load(idUsuario: number, options: { force?: boolean } = {}): Promise<void> {
    if (!options.force && perfil.value && loadedFor.value === idUsuario) return
    if (inflight) return inflight

    inflight = socialProfileService
      .getProfile(idUsuario)
      .then((loaded) => {
        perfil.value = loaded
        loadedFor.value = idUsuario
      })
      .finally(() => {
        inflight = null
      })

    return inflight
  }

  function clear(): void {
    perfil.value = null
    loadedFor.value = null
  }

  // Logout ou troca de usuário descartam o perfil em memória.
  watch(
    () => auth.usuario?.id,
    (id, previous) => {
      if (id !== previous) clear()
    },
  )

  return { perfil, hasSocialProfile, getPerfil, load, clear }
})
