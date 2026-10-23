import { http } from '@/lib/api/http'
import type { MenuDescriptions, MenuSummaryApiResponse } from '../types/menu.types'
import { buildMenuDescriptions } from './menu.mapper'

/** Comunicação com GET /menu/resumo. */
export const menuService = {
  async getDescriptions(): Promise<MenuDescriptions> {
    const { data } = await http.get<MenuSummaryApiResponse>('/menu/resumo')
    return buildMenuDescriptions(data.itens)
  },
}
