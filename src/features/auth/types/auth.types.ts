/** Usuário devolvido pela API (sem cpf nem senha_hash). */
export interface Usuario {
  id: number
  nome: string
  email: string
  username: string
  xp_usuario: number
  nivel_total: number
  foto_perfil: string | null
  nome_exibicao: string
  username_social: string
  biografia_social: string
  localizacao_estado: string | null
  visibilidade: 'publico' | 'privado'
}

export interface LoginPayload {
  identificador: string
  senha: string
}

export interface RegisterPayload {
  nome: string
  cpf: string
  email: string
  username: string
  senha: string
}

export interface ForgotPasswordResponse {
  mensagem: string
  /** Presente apenas quando a API roda com DEV_EXPOSE_OTP=true. */
  codigo_dev?: string
}

export interface ResetPasswordPayload {
  email: string
  reset_token: string
  nova_senha: string
}
