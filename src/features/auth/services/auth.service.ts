import { browserSessionHttp, http, publicHttp } from '@/lib/api/http'
import type {
  ApiSuccessResponse,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterUserResponse,
} from '../types/auth.types'
import { obterInformacoesDispositivo } from './device.service'

const BASE = '/v1/openfinance/usuario'
const BROWSER_SESSION = `${BASE}/sessao`
type BrowserSession = Pick<LoginResponse, 'sucesso' | 'usuario' | 'access_token'>

export const authService = {

  async register(payload: RegisterPayload): Promise<number> {
    const { data } = await publicHttp.post<RegisterUserResponse>(`${BASE}/criar-usuario`, {
      nome: payload.nome,
      cpf: payload.cpf,
      email: payload.email,
      username: payload.username,
      senha: payload.senha,
    })
    if (!data?.sucesso || typeof data.id_usuario !== 'number') {
      throw new Error(data?.mensagem ?? 'Não foi possível criar a conta.')
    }
    return data.id_usuario
  },

  async verifyRegisterOtp(idUsuario: number, codigo: string): Promise<void> {
    const { data } = await publicHttp.post<ApiSuccessResponse>(`${BASE}/consultar/otp/${idUsuario}`, {
      id_usuario: idUsuario,
      codigo,
    })
    if (!data?.sucesso) {
      throw new Error(data?.mensagem ?? 'Código inválido.')
    }
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const dispositivoInfo = obterInformacoesDispositivo()
    
    const { data } = await publicHttp.post<LoginResponse>(`${BASE}/login`, {
      email: payload.email,
      senha: payload.senha,
      dispositivo: dispositivoInfo,
    })
    
    if (!data?.sucesso || !data.usuario || !data.access_token) {
      throw new Error(data?.mensagem ?? 'Credenciais inválidas.')
    }
    return data
  },

  async createBrowserSession(accessToken: string): Promise<boolean> {
    try {
      const response = await browserSessionHttp.post(BROWSER_SESSION, undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      return response.status === 204
    } catch {
      return false
    }
  },

  async session(): Promise<BrowserSession> {
    const { data } = await browserSessionHttp.get<BrowserSession>(BROWSER_SESSION)
    if (!data?.sucesso || !Number.isSafeInteger(data.usuario?.id) || data.usuario.id <= 0 ||
      typeof data.access_token !== 'string' || !data.access_token) {
      throw new Error('Sessão inválida.')
    }
    return data
  },

  async logout(): Promise<void> {
    await browserSessionHttp.delete(BROWSER_SESSION)
  },

  // ---------------------------------------------------------------------------
  // Fluxo "Esqueci minha senha"
  // ---------------------------------------------------------------------------

  async getUserIdByEmail(email: string): Promise<number> {
    const url = `${BASE}/usuario/email/${email}`
    
    console.log('GET URL:', url)
    const { data } = await publicHttp.get<{ id_usuario: number, usuario?: { id: number } }>(url)
    console.log('Response data:', data)
    
    // A API retorna o id dentro de data.usuario.id, não diretamente em data.id_usuario
    const idUsuario = data.id_usuario ?? data.usuario?.id
    
    if (typeof idUsuario !== 'number') {
      throw new Error('Usuário não encontrado.')
    }
    return idUsuario
  },

  /**
   * Solicita OTP de redefinição de senha por e-mail.
   * POST /v1/openfinance/usuario/codigo-otp/senha/:id_usuario
   */
  async forgotPassword(idUsuario: number): Promise<ForgotPasswordResponse> {
    const { data } = await publicHttp.post<ForgotPasswordResponse>(`${BASE}/codigo-otp/senha/${idUsuario}`)
    console.log(data)
    return data
  },

  /**
   * Verifica o código OTP para redefinição de senha.
   * POST /v1/openfinance/usuario/alterar/verificar-codigo/:id_usuario
   */
  async resetPassword(idUsuario: number, codigo: string, novaSenha: string): Promise<void> {
    const { data } = await publicHttp.post<ApiSuccessResponse>(`${BASE}/alterar/verificar-codigo/${idUsuario}`, {
      codigo,
      novaSenha,
    })
    if (!data?.sucesso) {
      throw new Error(data?.mensagem ?? 'Não foi possível redefinir a senha.')
    }
  },

  async updateUsuario(idUsuario: number, payload: Partial<RegisterPayload>): Promise<void> {
    await http.patch(`${BASE}/usuario-update/${idUsuario}`, payload)
  },

  async deleteUsuario(idUsuario: number): Promise<void> {
    await http.delete(`${BASE}/usuario-delete/${idUsuario}`)
  },
}
