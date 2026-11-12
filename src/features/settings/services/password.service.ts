import { isAxiosError } from 'axios'

import { http } from '@/lib/api/http'

const BASE = '/v1/openfinance/usuario'

interface LoginCheckResponse {
  sucesso: boolean
  mensagem?: string
}

export const passwordService = {
  async verifyCurrentPassword(email: string, senha: string | undefined): Promise<boolean> {
    try {
      const { data } = await http.post<LoginCheckResponse>(`${BASE}/login`, { email, senha })
      return Boolean(data.sucesso)
    } catch (error) {
      if (isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 401)) {
        return false
      }
      throw error
    }
  },
}
