export type TipoProduto = 'CDB' | 'LCI' | 'LCA';
export type StatusAplicacao = 'PENDENTE' | 'CONCLUIDA' | 'FALHOU';

export interface RequisicaoProduto {
  nome: string;
  tipo: TipoProduto;
  emissor: string;
  classificacaoEmissor: string;
  taxaAnual: number;
  investimentoMinimo: number;
  prazoMeses: number;
  ativo?: boolean;
}

export interface RespostaResumoProduto {
  id: string;
  nome: string;
  tipo: TipoProduto;
  taxaAnual: number;
  investimentoMinimo: number;
  prazoMeses: number;
}

export interface RespostaDetalheProduto extends RespostaResumoProduto {
  emissor: string;
  classificacaoEmissor: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface RequisicaoConta {
  cpf: string;
  nomeTitular: string;
  saldoInicial?: number;
}

export interface RespostaConta {
  id: string;
  cpf: string;
  nomeTitular: string;
  saldo: number;
}

export interface RequisicaoAplicacao {
  cpf: string;
  produtoId: string;
  valor: number;
}

export interface RespostaAplicacao {
  id: string;
  contaId: string;
  contaCpf: string;
  produtoId: string;
  produtoNome: string;
  valor: number;
  status: StatusAplicacao;
  motivoFalha: string | null;
  taxaAplicada: number | null;
  dataVencimento: string | null;
  criadoEm: string;
}

export interface StatusFila {
  nome: string;
  existe: boolean;
  quantidadeMensagens: number;
  quantidadeConsumidores: number;
}

export interface RespostaStatusFila {
  aplicacoes: StatusFila;
  filaMorta: StatusFila;
}

export interface ItemCacheProduto {
  produtoId: string;
  ttlSegundos: number | null;
}

export interface RespostaStatusCache {
  listaProdutosCacheada: boolean;
  listaProdutosTtlSegundos: number | null;
  itensCacheProduto: ItemCacheProduto[];
}

export interface RespostaCotacaoDolar {
  par: string;
  cotacaoCompra: number;
  cotacaoVenda: number;
  consultadoEm: string;
}

export type EstadoCircuito = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface StatusIntegracaoExterna {
  habilitado: boolean;
  simulandoFalha: boolean;
  estadoCircuito: EstadoCircuito;
}

export interface RequisicaoToggleIntegracao {
  ativo: boolean;
}

// Envelope padrao de toda resposta da API (sucesso ou erro).
export interface RespostaApi<T> {
  sucesso: boolean;
  dados: T | null;
  mensagem: string;
  erros: string[];
}
