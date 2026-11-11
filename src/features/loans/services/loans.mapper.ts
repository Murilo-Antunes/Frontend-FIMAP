import dayjs from 'dayjs'
import type {
  Loan,
  LoanDetail,
  LoanDetailApiResponse,
  LoanInstallment,
  LoanInstallmentRaw,
  LoanOpportunity,
  LoanRaw,
} from '../types/loans.types'

const TIPO_LABELS: Record<string, string> = {
  CREDITO_PESSOAL_COM_CONSIGNACAO: 'Crédito Pessoal',
  CREDITO_PESSOAL: 'Crédito Pessoal',
  FINANCIAMENTO_VEICULO: 'Financiamento de Veículo',
  FINANCIAMENTO_IMOBILIARIO: 'Financiamento Imobiliário',
  CONSIGNADO: 'Consignado',
}

export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDateBR(value: string | Date): string {
  return dayjs(value).format('DD/MM/YYYY')
}

export function tipoLabel(tipo: string): string {
  return TIPO_LABELS[tipo] ?? 'Empréstimo'
}

export function mapLoan(raw: LoanRaw): Loan {
  const totalParcelas = raw.parcelasPagas + raw.parcelasRestantes
  const progresso = totalParcelas > 0 ? Math.round((raw.parcelasPagas / totalParcelas) * 1000) / 10 : 0

  return {
    id: raw.id,
    nome: raw.nome,
    tipoLabel: tipoLabel(raw.tipo),
    status: raw.status ?? 'ATIVO',
    valorContratado: raw.valorContratado,
    saldoDevedor: raw.saldoDevedor,
    parcelaMensal: raw.parcelaMensal ?? 0,
    taxaJurosMensal: raw.taxaJurosMensal ?? null,
    proximoVencimento: raw.proximoVencimento ? dayjs(raw.proximoVencimento).toDate() : null,
    parcelasPagas: raw.parcelasPagas,
    parcelasRestantes: raw.parcelasRestantes,
    totalParcelas,
    progresso,
  }
}

function mapInstallment(
  raw: LoanInstallmentRaw,
  totalParcelas: number,
  proximaNumero: number | null,
  descontoAntecipacaoPercentual: number | null,
): LoanInstallment {
  const vencimento = dayjs(raw.vencimento).toDate()
  const isProxima = raw.status === 'PENDENTE' && raw.numero === proximaNumero
  const diasParaVencimento =
    raw.status === 'PENDENTE' ? dayjs(vencimento).startOf('day').diff(dayjs().startOf('day'), 'day') : null

  const economiaEstimadaAntecipacao =
    raw.status === 'PENDENTE' && !isProxima && descontoAntecipacaoPercentual
      ? Math.round(raw.valor * (descontoAntecipacaoPercentual / 100) * 100) / 100
      : null

  return {
    numero: raw.numero,
    totalParcelas,
    vencimento,
    valor: raw.valor,
    status: raw.status,
    dataPagamento: raw.dataPagamento ? dayjs(raw.dataPagamento).toDate() : null,
    isProxima,
    diasParaVencimento,
    economiaEstimadaAntecipacao,
  }
}

/**
 * Mapeia a resposta completa de GET /emprestimos/:itemId/:emprestimoId/detalhe
 * (empréstimo + pendentes + pagas paginadas + amortizadas) para os view models
 * usados pelos componentes.
 */
export function mapLoanDetail(data: LoanDetailApiResponse): LoanDetail | null {
  if (!data.emprestimo) return null

  const loan = mapLoan(data.emprestimo)
  const totalParcelas = data.totalParcelas ?? loan.totalParcelas
  const desconto = data.emprestimo.descontoAntecipacaoPercentual ?? null

  const pendentesRaw = data.pendentes ?? []
  const proxima = [...pendentesRaw].sort((a, b) => dayjs(a.vencimento).diff(dayjs(b.vencimento)))[0]

  const pendentes = pendentesRaw
    .map((raw) => mapInstallment(raw, totalParcelas, proxima?.numero ?? null, desconto))
    .sort((a, b) => a.numero - b.numero)

  const amortizadas = (data.amortizadas ?? [])
    .map((raw) => mapInstallment(raw, totalParcelas, null, desconto))
    .sort((a, b) => b.numero - a.numero)

  const pagasVisiveis = (data.pagas?.itens ?? [])
    .map((raw) => mapInstallment(raw, totalParcelas, null, desconto))
    .sort((a, b) => b.numero - a.numero)

  return {
    loan,
    pendentes,
    amortizadas,
    pagasVisiveis,
    pagasTemMais: data.pagas?.temMais ?? false,
    pagasResumoRestante: data.pagas?.resumoRestante ?? null,
  }
}

/**
 * MOCK — conteúdo estático combinado com o time (card da tela de Histórico).
 * Quando o detector de oportunidades por IA existir de verdade, troque esta
 * função por uma chamada ao endpoint correspondente.
 */
export function buildMockAnticipationOpportunity(): LoanOpportunity {
  return {
    tag: 'Desconto de Juros',
    titulo: 'Economize até R$ 145,20 antecipando as parcelas finais 23 e 24.',
    descricao:
      'A amortização pelo Open Finance elimina encargos diários de liquidação contratual sem carência adicional.',
    primaryActionLabel: 'Simular Antecipação',
    secondaryActionLabel: 'Saiba Mais',
  }
}

/**
 * MOCK — conteúdo estático combinado com o time (card da tela de Empréstimos).
 * Mesma observação acima: trocar pela chamada real quando a IA existir.
 */
export function buildMockPortabilityOpportunity(): LoanOpportunity {
  return {
    titulo:
      'Você pode economizar até R$ 850,00 em juros fazendo a portabilidade deste contrato para uma taxa menor no Banco Inter (1,45% a.m.).',
    descricao: '',
    primaryActionLabel: 'Simular Portabilidade',
    destaque: {
      sigla: 'IN',
      titulo: 'Nova Parcela Estimada',
      subtitulo: 'Redução de ~R$ 35,40/mês',
      valor: 'R$ 384,60',
    },
  }
}