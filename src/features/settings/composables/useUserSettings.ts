import { computed, ref } from 'vue'

import { toApiError } from '@/lib/api/types/api-error'
import { settingsService } from '../services/settings.service'
import type { SettingKey, UserSettings } from '../types/settings.types'

/** Valores usados só quando o usuário ainda não tem linha em tbl_configuracoes (tudo ligado, como no design). */
const INITIAL_SETTINGS: UserSettings = {
  notificacao: true,
  alerta: true,
  relatorio: true,
  recomendacao: true,
  topicos: true,
}

/**
 * Carrega as configurações e salva cada alteração via PATCH assim que o usuário muda um toggle.
 * A atualização é otimista: o switch muda na hora e volta ao valor anterior se a API falhar.
 */
export function useUserSettings(idUsuario: number) {
  const settings = ref<UserSettings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const saving = ref<Set<SettingKey>>(new Set())

  const isReady = computed(() => settings.value !== null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const existing = await settingsService.get(idUsuario)
      if (existing) {
        settings.value = existing
        return
      }
      // Usuário novo: cria a linha com os padrões e já usa o que foi criado.
      await settingsService.create(idUsuario, INITIAL_SETTINGS)
      settings.value = { ...INITIAL_SETTINGS }
    } catch (e) {
      error.value = toApiError(e).mensagem
    } finally {
      loading.value = false
    }
  }

  async function toggle(key: SettingKey, value: boolean): Promise<void> {
    const current = settings.value
    if (!current) return

    const previous = current[key]
    settings.value = { ...current, [key]: value }
    saving.value = new Set(saving.value).add(key)
    error.value = null

    try {
      // Lê o estado mais recente: outros toggles podem ter mudado enquanto isso.
      await settingsService.update(idUsuario, settings.value)
    } catch (e) {
      if (settings.value) settings.value = { ...settings.value, [key]: previous }
      error.value = toApiError(e).mensagem
    } finally {
      const next = new Set(saving.value)
      next.delete(key)
      saving.value = next
    }
  }

  function isSaving(key: SettingKey): boolean {
    return saving.value.has(key)
  }

  function dismissError(): void {
    error.value = null
  }

  return { settings, loading, error, isReady, load, toggle, isSaving, dismissError }
}
