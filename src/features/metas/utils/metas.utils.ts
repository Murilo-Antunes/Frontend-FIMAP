// src/features/metas/utils/metas.utils.ts
import {
  Shield,
  Home,
  Plane,
  Car,
  TrendingUp,
  PiggyBank,
  GraduationCap,
  Star,
  type LucideIcon,
} from 'lucide-vue-next'
import type { Meta, MetaApi, PrazoMeta } from '../types/metas.types'

const MS_POR_ANO = 1000 * 60 * 60 * 24 * 365.25

/**
 * curto: < 1 ano | médio: >= 1 ano e < 5 anos | longo: >= 5 anos
 * (contado de hoje até a data_alvo da meta)
 */
export function classificarPrazo(dataAlvo: Date, hoje: Date = new Date()): PrazoMeta {
  const diffAnos = (dataAlvo.getTime() - hoje.getTime()) / MS_POR_ANO
  if (diffAnos < 1) return 'curto'
  if (diffAnos < 5) return 'medio'
  return 'longo'
}

export const LABEL_PRAZO: Record<PrazoMeta, string> = {
  curto: 'Curto prazo',
  medio: 'Médio prazo',
  longo: 'Longo prazo',
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Ex.: "Outubro de 2028" */
export function formatarMesAno(data: Date): string {
  return `${MESES[data.getMonth()]} de ${data.getFullYear()}`
}

/** Converte um `<input type="month">` ("2028-10") em Date (dia 1, meio-dia p/ evitar fuso). */
export function monthInputParaData(valor: string): Date {
  const [ano, mes] = valor.split('-').map(Number)
  return new Date(ano, (mes ?? 1) - 1, 1, 12)
}

/** Converte Date em valor de `<input type="month">`. */
export function dataParaMonthInput(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}`
}

/** Quantos meses inteiros faltam até a data alvo (nunca negativo). */
export function mesesRestantes(dataAlvo: Date, hoje: Date = new Date()): number {
  let meses =
    (dataAlvo.getFullYear() - hoje.getFullYear()) * 12 +
    (dataAlvo.getMonth() - hoje.getMonth())
  if (dataAlvo.getDate() < hoje.getDate()) meses -= 1
  return Math.max(meses, 0)
}

export function percentualProgresso(meta: Pick<Meta, 'valorTotal' | 'valorDesejado'>): number {
  if (meta.valorDesejado <= 0) return 0
  return Math.min(Math.round((meta.valorTotal / meta.valorDesejado) * 100), 100)
}

/**
 * Ícone por categoria. Casamento por substring (não nome exato) pra aguentar variações
 * de texto ("Viagem", "Viagem e Férias", "Viagem & Férias" caem todas no mesmo ícone).
 * Só cai na estrela quando nenhuma regra bate — ou seja, estrela é mesmo exclusiva de
 * categoria personalizada que não se encaixa em nenhum tema conhecido.
 * (tbl_categoria_meta não guarda ícone — resolvido só no front, ver observações.)
 */
function normalizarNomeCategoria(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const REGRAS_ICONE: { chaves: string[]; icone: LucideIcon }[] = [
  { chaves: ['reserva', 'emergencia'], icone: Shield },
  { chaves: ['imovel', 'casa', 'apartamento', 'moradia'], icone: Home },
  { chaves: ['viagem', 'ferias'], icone: Plane },
  { chaves: ['veiculo', 'carro', 'moto'], icone: Car },
  { chaves: ['aposentadoria', 'previdencia'], icone: PiggyBank },
  { chaves: ['educacao', 'estudo', 'curso', 'faculdade'], icone: GraduationCap },
  { chaves: ['liberdade'], icone: TrendingUp },
]

export function getIconePorCategoria(nomeCategoria: string): LucideIcon {
  const chaveBusca = normalizarNomeCategoria(nomeCategoria)
  const regra = REGRAS_ICONE.find((r) => r.chaves.some((chave) => chaveBusca.includes(chave)))
  return regra?.icone ?? Star
}

/** Mapeia o formato snake_case da API para o modelo usado no front. */
export function mapearMetaApi(raw: MetaApi): Meta {
  return {
    id: raw.id,
    nome: raw.nome,
    descricao: raw.descricao ?? '',
    valorInicio: Number(raw.valor_inicio),
    valorDesejado: Number(raw.valor_desejado),
    valorTotal: Number(raw.valor_total),
    aporteMensal: Number(raw.aporte_mensal),
    dataAlvo: new Date(raw.data_alvo),
    status: raw.status,
    idCategoria: raw.id_categoria,
    idContaVinculada: raw.id_conta_vinculada,
  }
}
