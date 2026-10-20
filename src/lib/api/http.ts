import axios from 'axios'
import { env } from '@/config/env'

/**
 * Instância única do Axios usada por todos os serviços.
 * `withCredentials` faz o navegador enviar/receber os cookies HttpOnly da sessão.
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})
