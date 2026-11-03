import axios from 'axios'
import { env } from '@/config/env'

/**
 * Instância única do Axios usada por todos os serviços (auth, conexão, dashboard).
 * A nova API não usa cookies nem token no header por enquanto: sem withCredentials.
 * Timeout generoso (20 s) para cobrir chamadas Open Finance que dependem do Pluggy.
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})
