import { http } from '@/lib/api/http'
import type {
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  Usuario,
} from '../types/auth.types'

/** Comunicação com os endpoints /auth/*. Os erros do Axios sobem para quem chamou. */
export const authService = {
  async login(payload: LoginPayload): Promise<Usuario> {
    const { data } = await http.post<{ usuario: Usuario }>('/auth/login', payload)
    return data.usuario
  },

  async register(payload: RegisterPayload): Promise<Usuario> {
    const { data } = await http.post<{ usuario: Usuario }>('/auth/register', payload)
    return data.usuario
  },

  /**
   * Sessão atual sem ruído: responde 200 mesmo sem login (`null` = anônimo). Só falha com 401
   * quando o acesso venceu mas dá para renovar; o interceptor renova e repete a chamada.
   */
  async session(): Promise<Usuario | null> {
    const { data } = await http.get<{ autenticado: boolean; usuario?: Usuario }>('/auth/session')
    return data.autenticado && data.usuario ? data.usuario : null
  },

  async me(): Promise<Usuario> {
    const { data } = await http.get<{ usuario: Usuario }>('/auth/me')
    return data.usuario
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout')
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const { data } = await http.post<ForgotPasswordResponse>('/auth/forgot-password', { email })
    return data
  },

  async verifyOtp(email: string, codigo: string): Promise<string> {
    const { data } = await http.post<{ reset_token: string }>('/auth/verify-otp', { email, codigo })
    return data.reset_token
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await http.post('/auth/reset-password', payload)
  },
}
