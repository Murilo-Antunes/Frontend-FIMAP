/** Usuário devolvido pelo login (POST /v1/openfinance/usuario/login). */
export interface Usuario {
  id: number
  nome: string
  email: string
  username: string
  xp_usuario: number
  nivel_total: number
  foto_perfil: string | null
  nome_exibicao: string
  username_social: string | null
  biografia_social: string | null
  localizacao_estado: string | null
  visibilidade: 'publico' | 'privado'
}

export interface DispositivoPayload {
  nome: string
  sistema_operacional: string
  identificador: string
}

export interface LoginPayload {
  /** A nova API aceita apenas e-mail como identificador. */
  email: string
  senha: string
}

export interface LoginPayloadWithDevice extends LoginPayload {
  dispositivo: DispositivoPayload
}

export interface RegisterPayload {
  nome: string
  cpf: string
  email: string
  username: string
  senha: string
}

/** Resposta de POST /v1/openfinance/usuario/criar-usuario */
export interface RegisterUserResponse {
  sucesso: boolean
  mensagem: string
  id_usuario: number
}

/** Resposta de POST /v1/openfinance/usuario/login */
export interface LoginResponse {
  sucesso: boolean
  mensagem: string
  usuario: Usuario
}

/** Resposta genérica de sucesso/mensagem */
export interface ApiSuccessResponse {
  sucesso: boolean
  mensagem: string
}

/** Resposta de POST /v1/openfinance/usuario/codigo-otp/senha (solicitação de reset por email) */
export interface ForgotPasswordResponse {
  sucesso: boolean
  mensagem: string
  /** Presente em DEV quando a API expõe o código diretamente. */
  codigo_dev?: string
}
