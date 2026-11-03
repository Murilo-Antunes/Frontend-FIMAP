/**
 * Serviço para capturar automaticamente informações do dispositivo do usuário.
 */

export interface DispositivoInfo {
  nome: string
  sistema_operacional: string
  identificador: string
}

/**
 * Detecta o sistema operacional do usuário baseado no User Agent.
 */
function detectarSistemaOperacional(): string {
  const ua = navigator.userAgent
  
  if (ua.includes('Windows NT 10.0')) return 'Windows 10'
  if (ua.includes('Windows NT 11.0')) return 'Windows 11'
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1'
  if (ua.includes('Windows NT 6.2')) return 'Windows 8'
  if (ua.includes('Windows NT 6.1')) return 'Windows 7'
  if (ua.includes('Windows')) return 'Windows'
  
  if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/)
    if (match) {
      const version = match[1].replace('_', '.')
      return `macOS ${version}`
    }
    return 'macOS'
  }
  
  if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+(\.\d+)?)/)
    if (match) return `Android ${match[1]}`
    return 'Android'
  }
  
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS (\d+_\d+)/)
    if (match) {
      const version = match[1].replace('_', '.')
      return `iOS ${version}`
    }
    return 'iOS'
  }
  
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('CrOS')) return 'Chrome OS'
  
  return 'Desconhecido'
}

/**
 * Detecta o tipo de dispositivo (Desktop, Mobile, Tablet).
 */
function detectarTipoDispositivo(): string {
  const ua = navigator.userAgent
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet'
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile'
  }
  
  return 'Desktop'
}

/**
 * Detecta o navegador do usuário.
 */
function detectarNavegador(): string {
  const ua = navigator.userAgent
  
  if (ua.includes('Edg/') || ua.includes('Edge/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/') && !ua.includes('Edg')) return 'Google Chrome'
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera'
  
  return 'Navegador'
}

/**
 * Gera um identificador único para o dispositivo baseado em características do navegador.
 * Usa localStorage para persistir o identificador entre sessões.
 */
function gerarIdentificadorDispositivo(): string {
  const STORAGE_KEY = 'fimap_device_id'
  
  // Tenta recuperar identificador existente
  const existingId = localStorage.getItem(STORAGE_KEY)
  if (existingId) return existingId
  
  // Gera novo identificador baseado em características do dispositivo
  const characteristics = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ].join('|')
  
  // Gera hash simples (para produção, considere usar crypto.subtle.digest)
  let hash = 0
  for (let i = 0; i < characteristics.length; i++) {
    const char = characteristics.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Converte para 32bit integer
  }
  
  const deviceId = `device-${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`
  
  // Persiste o identificador
  try {
    localStorage.setItem(STORAGE_KEY, deviceId)
  } catch (e) {
    console.warn('Não foi possível salvar o identificador do dispositivo:', e)
  }
  
  return deviceId
}

/**
 * Captura automaticamente todas as informações do dispositivo do usuário.
 */
export function obterInformacoesDispositivo(): DispositivoInfo {
  const tipo = detectarTipoDispositivo()
  const navegador = detectarNavegador()
  const so = detectarSistemaOperacional()
  
  return {
    nome: `${tipo} - ${navegador}`,
    sistema_operacional: so,
    identificador: gerarIdentificadorDispositivo(),
  }
}
