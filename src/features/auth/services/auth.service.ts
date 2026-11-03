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

/**
 * Comunicação com os endpoints de usuário da nova API.
 *
 * ⚠️  Gaps conhecidos (conversados com o backend):
 *  1. Login aceita apenas e-mail — username não está disponível como identificador.
 *  2. Não há sessão persistida (cookie/token): o usuário fica apenas em memória Pinia.
 *     Recarregar a página desloga o usuário.
 *  3. O fluxo de reset de senha usa `id_usuario` nos endpoints `consultar/otp` e
 *     `alterar/senha`. O email é usado para descobrir o ID via `GET /usuarios?email=...`
 *     — esse endpoint ainda não existe; usamos `codigo-otp/senha` que recebe email e
 *     constrói o payload internamente no backend.
 *  4. Não há endpoint de logout (sem sessão server-side).
 *  5. Não há endpoint de re-envio de OTP.
 */
export const authService = {
  /**
   * Cadastro: POST /v1/openfinance/usuario/criar-usuario
   * Retorna o id do usuário criado e dispara envio de OTP por e-mail.
   */
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

  /**
   * Verificação OTP pós-cadastro: POST /v1/openfinance/usuario/consultar/otp
   * Confirma que o e-mail pertence ao usuário antes de liberar o login.
   */
  async verifyRegisterOtp(idUsuario: number, codigo: string): Promise<void> {
    const { data } = await http.post<ApiSuccessResponse>(`${BASE}/consultar/otp/${idUsuario}`, {
      id_usuario: idUsuario,
      codigo,
    })
    if (!data?.sucesso) {
      throw new Error(data?.mensagem ?? 'Código inválido.')
    }
  },

  /**
   * Login: POST /v1/openfinance/usuario/login
   * Retorna os dados do usuário. Sem token/cookie: sessão fica em memória.
   * As informações do dispositivo são capturadas automaticamente.
   */
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

  /**
   * Sem endpoint de sessão persistida. Retorna sempre null.
   * O guard de rota trata `status === 'desconhecido'` chamando este método;
   * em memória o usuário já está em auth.store, então o guard não chega aqui
   * após o primeiro login dentro da sessão do navegador.
   */
  async session(): Promise<Usuario | null> {
    return null
  },

  /**
   * Logout local: sem endpoint server-side, apenas limpa a store.
   * Mantemos a assinatura async por compatibilidade com auth.store.
   */
  async logout(): Promise<void> {
    // Sem sessão server-side: nada a invalidar na API.
  },

  // ---------------------------------------------------------------------------
  // Fluxo "Esqueci minha senha"
  // ---------------------------------------------------------------------------

  /**
   * Busca o ID do usuário pelo e-mail.
   * GET /v1/openfinance/usuario/email/:email
   */
  async getUserIdByEmail(email: string): Promise<number> {
    const { data } = await http.get<{ id_usuario: number }>(`${BASE}/usuario/email/${email}`)
    if (typeof data.id_usuario !== 'number') {
      throw new Error('Usuário não encontrado.')
    }
    return data.id_usuario
  },

  /**
   * Solicita OTP de redefinição de senha por e-mail.
   * POST /v1/openfinance/usuario/codigo-otp/senha/:id_usuario
   */
  async forgotPassword(idUsuario: number): Promise<ForgotPasswordResponse> {
    const { data } = await http.post<ForgotPasswordResponse>(`${BASE}/codigo-otp/senha/${idUsuario}`)
    return data
  },

  /**
   * Redefine a senha após OTP verificado.
   * POST /v1/openfinance/usuario/alterar/senha/:id_usuario  { codigo, nova_senha }
   */
  async resetPassword(idUsuario: number, codigo: string, novaSenha: string): Promise<void> {
    const { data } = await http.post<ApiSuccessResponse>(`${BASE}/alterar/senha/${idUsuario}`, {
      codigo,
      novaSenha,
    })
    if (!data?.sucesso) {
      throw new Error(data?.mensagem ?? 'Não foi possível redefinir a senha.')
    }
  },

  // ---------------------------------------------------------------------------
  // Operações do perfil (requerem id_usuario em memória após login)
  // ---------------------------------------------------------------------------

  /**
   * Atualiza dados do perfil.
   * PATCH /v1/openfinance/usuario/usuario-update/:id_usuario
   */
  async updateUsuario(idUsuario: number, payload: Partial<RegisterPayload>): Promise<void> {
    await http.patch(`${BASE}/usuario-update/${idUsuario}`, payload)
  },

  /**
   * Remove a conta.
   * DELETE /v1/openfinance/usuario/usuario-delete/:id_usuario
   */
  async deleteUsuario(idUsuario: number): Promise<void> {
    await http.delete(`${BASE}/usuario-delete/${idUsuario}`)
  },
}
