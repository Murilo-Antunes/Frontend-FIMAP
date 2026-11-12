import { isAxiosError } from 'axios'

import { http } from '@/lib/api/http'

const BASE = '/v1/openfinance/usuario'

interface BasicResponse {
  sucesso: boolean
  mensagem?: string
}

export const passwordService = {
  /**
   * Confere a senha atual do usuário logado: POST /alterar/verificar-senha-atual/:id_usuario.
   *
   * Retorna `true` se a senha confere e `false` se o backend responder 401.
   * Qualquer outro erro (400 de validação, rede, 500...) é relançado para a tela
   * mostrar a mensagem — assim um erro de contrato nunca vira "senha incorreta".
   */
  async verifyCurrentPassword(idUsuario: number, senha: string): Promise<boolean> {
    try {
      const { data } = await http.post<BasicResponse>(
        `${BASE}/alterar/verificar-senha-atual/${idUsuario}`,
        { senha },
      )
      return Boolean(data.sucesso)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) return false
      throw error
    }
  },

  /**
   * Troca a senha do usuário logado: PATCH /alterar/senha-atual/:id_usuario.
   * O backend confere a senha atual novamente e grava a nova na mesma chamada.
   * Erros (401 senha atual incorreta, 400 senha curta/igual...) são relançados.
   */
  async changePassword(idUsuario: number, senhaAtual: string, novaSenha: string): Promise<void> {
    await http.patch<BasicResponse>(`${BASE}/alterar/senha-atual/${idUsuario}`, {
      senhaAtual,
      novaSenha,
    })
  },
}
