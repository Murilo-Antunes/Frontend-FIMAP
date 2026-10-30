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
    const { data } = await http.post<{ usuario: Usuario }>('/v1/openfinance/usuario/criar-usuario', payload)
    return data.usuario
  },

  async me(): Promise<Usuario> {
    
    const { data } = await http.get<{ usuario: Usuario }>('/v1/openfinance/usuario/usuario/id/1')
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
