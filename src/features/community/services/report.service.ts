import { http } from '@/lib/api/http'
import type { CategoriaDenuncia, ReportPayload, ReportTarget } from '../types/community.types'
import { communityEndpoints } from './community.endpoints'

/** Linha crua de GetAllCategoryComplant; o nome das colunas não foi enviado, então normalizamos. */
type CategoriaRaw = Record<string, unknown>

function toCategoria(raw: CategoriaRaw): CategoriaDenuncia {
  const id = Number(raw.id ?? raw.id_categoria)
  const nome = String(raw.nome ?? raw.nome_categoria ?? raw.titulo ?? raw.categoria ?? raw.descricao ?? '')
  return { id, nome }
}

export const reportService = {
  /** GET /v1/comunidade/denuncia/categorias → { categorias: [...] } */
  async listCategories(signal?: AbortSignal): Promise<CategoriaDenuncia[]> {
    const { data } = await http.get<{ sucesso: boolean; categorias: CategoriaRaw[] }>(
      communityEndpoints.reportCategories,
      { signal },
    )
    return (data.categorias ?? []).map(toCategoria).filter((c) => Number.isInteger(c.id) && c.id > 0 && c.nome)
  },

  /**
   * Escolhe a rota certa pelo tipo do alvo:
   *  - post   → POST /v1/comunidade/denuncia/criar
   *             { id_usuario, id_post, id_categoria, titulo, descricao }
   *  - perfil → POST /v1/comunidade/denuncias/denunciar-usuario
   *             { id_usuario, id_usuario_denunciado, id_categoria, titulo, descricao }
   */
  async create(target: ReportTarget, idUsuario: number, payload: ReportPayload): Promise<void> {
    const base = {
      id_usuario: idUsuario,
      id_categoria: payload.idCategoria,
      titulo: payload.titulo.trim(),
      descricao: payload.descricao.trim(),
    }

    if (target.tipo === 'post') {
      await http.post(communityEndpoints.reportPost, { ...base, id_post: target.id })
      return
    }
    await http.post(communityEndpoints.reportUser, { ...base, id_usuario_denunciado: target.id })
  },
}
