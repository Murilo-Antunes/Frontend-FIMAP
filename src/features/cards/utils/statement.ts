import type {
  FaturaExtrato,
  GrupoLancamentos,
  LancamentoExtrato,
  StatusFaturaExtrato,
} from '../types/cards-statement.types'

/** Valor reservado do filtro de categoria que significa "sem filtro". */
export const CATEGORIA_TODAS = '__todas__'

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

const MESES_ABREV = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const

const DIA_MS = 86_400_000

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatadorNumero = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const formatadorHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

interface DataLida {
  data: Date
  temHora: boolean
}

/**
 * Lê a data do lançamento. `YYYY-MM-DD` puro é interpretado como data local
 * (new Date('2026-10-12') seria UTC e, no Brasil, cairia no dia anterior).
 */
function lerData(valor: string): DataLida | null {
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (somenteData) {
    const [, ano, mes, dia] = somenteData
    return { data: new Date(Number(ano), Number(mes) - 1, Number(dia)), temHora: false }
  }
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : { data, temHora: true }
}

/** "2026-10" → "Outubro / 2026" */
export function rotuloMes(mes: string): string {
  const partes = /^(\d{4})-(\d{2})$/.exec(mes)
  if (!partes) return mes
  const nome = MESES[Number(partes[2]) - 1]
  return nome ? `${nome} / ${partes[1]}` : mes
}

/** "2026-10-15" → "15 de Outubro" */
export function formatarVencimento(iso: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!partes) return iso
  const nome = MESES[Number(partes[2]) - 1]
  return nome ? `${Number(partes[3])} de ${nome}` : iso
}

const ROTULOS_FATURA: Record<StatusFaturaExtrato, string> = {
  aberta: 'Fatura atual',
  fechada: 'Fatura fechada',
  paga: 'Fatura paga',
}

export function rotuloFatura(status: StatusFaturaExtrato): string {
  return ROTULOS_FATURA[status]
}

export function textoVencimento(fatura: FaturaExtrato): string {
  const data = formatarVencimento(fatura.vencimento)
  return fatura.status === 'paga' ? `Venceu em ${data}` : `Vence em ${data}`
}

function inicioDoDiaUtc(data: Date): number {
  return Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
}

function rotuloDia(data: Date, agora: Date): string {
  const dia = String(data.getDate()).padStart(2, '0')
  const base = `${dia} ${MESES_ABREV[data.getMonth()] ?? ''}`
  const diferenca = Math.round((inicioDoDiaUtc(agora) - inicioDoDiaUtc(data)) / DIA_MS)
  if (diferenca === 0) return `HOJE, ${base}`
  if (diferenca === 1) return `ONTEM, ${base}`
  return base
}

function chaveDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

/** Ordena do mais recente para o mais antigo e agrupa por dia (fuso local). */
export function agruparPorDia(
  lancamentos: readonly LancamentoExtrato[],
  agora: Date = new Date(),
): GrupoLancamentos[] {
  const lidos = lancamentos.map((lancamento) => ({ lancamento, lida: lerData(lancamento.data) }))
  lidos.sort((a, b) => (b.lida?.data.getTime() ?? 0) - (a.lida?.data.getTime() ?? 0))

  const grupos = new Map<string, GrupoLancamentos>()
  for (const { lancamento, lida } of lidos) {
    const chave = lida ? chaveDia(lida.data) : 'sem-data'
    let grupo = grupos.get(chave)
    if (!grupo) {
      grupo = { chave, rotulo: lida ? rotuloDia(lida.data, agora) : 'SEM DATA', lancamentos: [] }
      grupos.set(chave, grupo)
    }
    grupo.lancamentos.push(lancamento)
  }
  return [...grupos.values()]
}

export function subtituloLancamento(lancamento: LancamentoExtrato): string {
  if (lancamento.tipo === 'pagamento') return 'Crédito compensado'
  const lida = lerData(lancamento.data)
  return lida?.temHora
    ? `${lancamento.categoria} • ${formatadorHora.format(lida.data)}`
    : lancamento.categoria
}

export function detalheLancamento(lancamento: LancamentoExtrato): string {
  if (lancamento.tipo === 'pagamento') {
    return lancamento.status === 'pendente' ? 'Pendente' : 'Confirmado'
  }
  if (lancamento.modalidade === 'recorrente') return 'Recorrente'
  const total = lancamento.totalParcelas ?? 1
  if (total > 1 && lancamento.parcelaAtual) {
    return `Crédito ${total}x (${lancamento.parcelaAtual}/${total})`
  }
  return 'Crédito 1x'
}

export function valorLancamento(lancamento: LancamentoExtrato): string {
  const valor = formatarMoeda(lancamento.valor)
  return lancamento.tipo === 'pagamento' ? `- ${valor}` : valor
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Categorias presentes no período (pagamentos não têm categoria de gasto). */
export function listarCategorias(lancamentos: readonly LancamentoExtrato[]): string[] {
  const categorias = new Set<string>()
  for (const lancamento of lancamentos) {
    if (lancamento.tipo !== 'pagamento' && lancamento.categoria) categorias.add(lancamento.categoria)
  }
  return [...categorias].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

interface FiltrosExtrato {
  busca: string
  categoria: string
}

/** Busca por descrição, categoria ou valor ("382,40", "3.840", "3840"). */
export function filtrarLancamentos(
  lancamentos: readonly LancamentoExtrato[],
  { busca, categoria }: FiltrosExtrato,
): LancamentoExtrato[] {
  const termo = normalizar(busca.replace(/r\$/gi, ''))

  return lancamentos.filter((lancamento) => {
    if (categoria !== CATEGORIA_TODAS && lancamento.categoria !== categoria) return false
    if (!termo) return true

    const alvo = normalizar(
      [
        lancamento.descricao,
        lancamento.categoria,
        formatadorNumero.format(lancamento.valor),
        lancamento.valor.toFixed(2),
      ].join(' '),
    )
    return alvo.includes(termo)
  })
}
