// src/features/dashboard/types/finance.types.ts

export interface ContaApiItem {
  id: string;
  nome: string;
  tipo: string;
  subtipo: string;
  saldo: number;
  limite?: number | null;
  limiteDisponivel?: number | null;
  moeda: string;
  instituicao?: string | null;
}

export interface SaldoNucleoData {
  atualizando: boolean;
  saldoTotal: number;
  contas: ContaApiItem[];
}

export interface CartaoApiItem {
  id: string;
  nome: string;
  tipo: string;
  subtipo: string;
  saldo: number;
  faturaAberta: number;
  limite: number;
  limiteDisponivel: number;
  dataFechamentoFatura: string | null;
  dataVencimentoFatura: string | null;
  diasParaFechamento?: number;
  diasParaVencimento?: number;
  moeda: string;
}

export interface CartoesData {
  atualizando: boolean;
  total: number;
  cartoes: CartaoApiItem[];
}

export interface ContasConectadasData {
  atualizando: boolean;
  total: number;
  contas: ContaApiItem[];
}

export interface InvestimentoApiItem {
  id: string;
  nome: string;
  tipo: string;
  subtipo: string;
  valor: number;
  moeda: string;
  instituicao?: string | null;
}

export interface InvestimentosData {
  atualizando: boolean;
  total: number;
  investimentos: InvestimentoApiItem[];
}

export interface EmprestimoApiItem {
  id: string;
  nome: string;
  tipo: string;
  modalidade: string;
  saldoDevedor: number;
  valorContratado: number;
  parcelasPagas: number;
  parcelasRestantes: number;
  parcelaMensal: number | null;
  vencimento: string;
  moeda: string;
}

export interface EmprestimosData {
  atualizando: boolean;
  total: number;
  emprestimos: EmprestimoApiItem[];
}

// src/features/dashboard/types/finance.types.ts

export type TransacoesFiltro = 'ENTRADA' | 'SAIDA' | 'RECEITA' | 'DESPESA';

// Wrapper genérico para respostas da API (caso o backend utilize)
export interface ApiResponse<T = any> {
  sucesso?: boolean;
  mensagem?: string;
  dados?: T;
  [key: string]: any;
}

export interface TransacaoApiItem {
  id: string;
  descricao: string;
  categoria?: string;
  formaPagamento?: string;
  tipoPagamentoTag?: string;
  instituicao?: string;
  valor: number;
  tipo: TransacoesFiltro;
  data: string; // ex: YYYY-MM-DD
  hora?: string;
  conta?: string;
}

export interface TransacoesResponseData {
  atualizando: boolean;
  total: number;
  transacoes: TransacaoApiItem[];
}