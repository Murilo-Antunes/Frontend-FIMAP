import { http } from '@/lib/api/http'
import { extractList, pickString } from '@/lib/api/extract'
import type { ConnectionRef } from '@/features/connection/types/connection-ref'

/**
 * Lista TODAS as conexões do usuário (as telas de Contas e Investimentos agregam todos os bancos).
 * Rota: GET /v1/openfinance/conexoes/:idUsuario  →  { conexoes: [...] }
 */
export async function listConnectionRefs(
  usuarioId: number | string,
  signal?: AbortSignal,
): Promise<ConnectionRef[]> {
  const { data } = await http.get<unknown>(`/v1/openfinance/conexoes/${encodeURIComponent(String(usuarioId))}`, {
    signal,
  })

  const refs = new Map<string, ConnectionRef>()
  extractList(data, ['conexoes']).forEach((raw, index) => {
    // O backend retorna o itemId da Pluggy em "external_connection_id" (confirmado em produção).
    const itemId = pickString(raw, ['external_connection_id', 'itemId', 'item_id', 'id_item'])
    if (!itemId || refs.has(itemId)) return
    refs.set(itemId, {
      itemId,
      // GAP DE BACKEND: /v1/openfinance/conexoes/:idUsuario não retorna o nome da instituição
      // (nem "instituicao" das contas, que vem null). Só devolve "provedor": "pluggy" (o agregador,
      // não o banco). Até o backend incluir um campo como "nome_instituicao", usamos um rótulo genérico.
      institutionName: pickString(raw, ['nomeInstituicao', 'nome_instituicao', 'instituicao', 'connectorName']) ?? `Instituição ${index + 1}`,
      logoUrl: pickString(raw, ['logoUrl', 'logo_url', 'imageUrl', 'image_url']),
      updatedAt: pickString(raw, ['ultima_sincronizacao', 'atualizadoEm', 'atualizado_em', 'updatedAt', 'lastUpdatedAt']),
    })
  })
  return [...refs.values()]
}
