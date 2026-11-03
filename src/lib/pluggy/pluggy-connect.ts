/**
 * Carregamento e tipos mínimos do widget Pluggy Connect (script oficial da Pluggy).
 *
 * O script é carregado só quando a tela de conexão é usada, numa versão FIXA (nunca "latest",
 * para uma atualização da Pluggy não mudar o comportamento sem você perceber).
 * Se o app usar CSP, libere `script-src https://cdn.pluggy.ai` e `frame-src` do widget da Pluggy.
 */
const PLUGGY_CONNECT_SCRIPT_URL = 'https://cdn.pluggy.ai/pluggy-connect/v2.7.0/pluggy-connect.js'

export interface PluggyConnectOptions {
  /** Token de curta duração gerado pelo backend (POST /connect-token). */
  connectToken: string
  /** Inclui conectores de teste (Sandbox). Nunca em produção. */
  includeSandbox?: boolean
  onSuccess: (data: { item: { id: string; consentId?: string } }) => void | Promise<void>
  onError?: (error: { message: string }) => void
  onOpen?: () => void
  onClose?: () => void
}

export interface PluggyConnectInstance {
  init: () => Promise<void>
  destroy?: () => void
}

export type PluggyConnectConstructor = new (options: PluggyConnectOptions) => PluggyConnectInstance

declare global {
  interface Window {
    PluggyConnect?: PluggyConnectConstructor
  }
}

let loading: Promise<PluggyConnectConstructor> | null = null

export function loadPluggyConnect(): Promise<PluggyConnectConstructor> {
  if (window.PluggyConnect) return Promise.resolve(window.PluggyConnect)

  if (!loading) {
    loading = new Promise<PluggyConnectConstructor>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = PLUGGY_CONNECT_SCRIPT_URL
      script.async = true
      script.onload = () => {
        if (window.PluggyConnect) resolve(window.PluggyConnect)
        else reject(new Error('O widget de conexão foi carregado, mas não está disponível.'))
      }
      script.onerror = () => {
        script.remove()
        reject(new Error('Não foi possível carregar o widget de conexão. Verifique sua internet.'))
      }
      document.head.appendChild(script)
    }).catch((error: unknown) => {
      loading = null // permite tentar de novo
      throw error
    })
  }
  return loading
}
