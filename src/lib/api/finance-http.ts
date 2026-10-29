import axios from 'axios'
import { env } from '@/config/env'

/**
 * Cliente da API financeira (Open Finance). Fica separado do `http` de autenticação porque:
 *  - é outro serviço (outra URL);
 *  - por enquanto não tem autenticação, então não envia cookies nem tenta renovar sessão.
 * Quando a autenticação existir, ela entra aqui (cookies/interceptor) sem tocar nas features.
 */
export const financeHttp = axios.create({
  baseURL: env.financeApiUrl,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})
