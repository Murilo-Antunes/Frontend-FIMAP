import { http } from '@/lib/api/http'
import type {
  ApiSuccessResponse,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterUserResponse,
  Usuario,
} from '../types/auth.types'
import { obterInformacoesDispositivo } from './device.service'

const BASE = '/v1/openfinance/usuario'

export const authService = {

  async register(payload: RegisterPayload): Promise<number> {
    const { data } = await http.post<RegisterUserResponse>(`${BASE}/criar-usuario`, {
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
    const { data } = await http.post<ApiSuccessResponse>(`${BASE}/consultar/otp/${idUsuario}`, {
      id_usuario: idUsuario,
      codigo,
    })
    if (!data?.sucesso) {
      throw new Error(data?.mensagem ?? 'Código inválido.')
    }
  },

  async login(payload: LoginPayload): Promise<Usuario> {
    const dispositivoInfo = obterInformacoesDispositivo()
    
    const { data } = await http.post<LoginResponse>(`${BASE}/login`, {
      email: payload.email,
      senha: payload.senha,
      dispositivo: dispositivoInfo,
    })
    
    if (!data?.sucesso || !data.usuario) {
      throw new Error(data?.mensagem ?? 'Credenciais inválidas.')
    }
    return data.usuario
  },

  async session(): Promise<Usuario | null> {
    return null
  },

  async logout(): Promise<void> {
    // Sem sessão server-side: nada a invalidar na API.
  },

  // ---------------------------------------------------------------------------
  // Fluxo "Esqueci minha senha"
  // ---------------------------------------------------------------------------

  async getUserIdByEmail(email: string): Promise<number> {
    const url = `${BASE}/usuario/email/${email}`
    
    console.log('GET URL:', url)
    const { data } = await http.get<{ id_usuario: number, usuario?: { id: number } }>(url)
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
    const { data } = await http.post<ForgotPasswordResponse>(`${BASE}/codigo-otp/senha/${idUsuario}`)
    console.log(data)
    return data
  },

  /**
   * Verifica o código OTP para redefinição de senha.
   * POST /v1/openfinance/usuario/alterar/verificar-codigo/:id_usuario
   */
  async verifyPasswordOtp(idUsuario: number, codigo: string): Promise<void> {
    const { data } = await http.post<ApiSuccessResponse>(`${BASE}/alterar/verificar-codigo/${idUsuario}`, {
      codigo,
    })
    if (!data?.sucesso) {
      throw new Error(data?.mensagem ?? 'Código inválido.')
    }
  },

  /**
   * Redefine a senha após OTP verificado.
   * (Esta função agora será usada apenas para atualizar a senha via updateUsuario)
   */
  async updatePassword(idUsuario: number, novaSenha: string): Promise<void> {
    console.log(`Atualizando senha para usuário ${idUsuario}...`);
    await this.updateUsuario(idUsuario, { senha: novaSenha } as any)
    console.log(`Senha atualizada com sucesso para usuário ${idUsuario}.`);
  },

  async updateUsuario(idUsuario: number, payload: Partial<RegisterPayload>): Promise<void> {
    console.log(`Enviando PATCH para ${BASE}/usuario-update/${idUsuario} com payload:`, payload);
    await http.patch(`${BASE}/usuario-update/${idUsuario}`, payload)
  },

  async deleteUsuario(idUsuario: number): Promise<void> {
    await http.delete(`${BASE}/usuario-delete/${idUsuario}`)
  },
}
