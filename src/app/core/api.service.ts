import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from './api-config';
import {
  RespostaConta,
  RequisicaoConta,
  RespostaApi,
  RespostaAplicacao,
  RequisicaoAplicacao,
  RespostaStatusCache,
  RespostaStatusFila,
  RespostaDetalheProduto,
  RequisicaoProduto,
  RespostaResumoProduto,
} from './models';

/**
 * Toda resposta da API vem envelopada em RespostaApi<T> ({sucesso, dados,
 * mensagem, erros}) - os metodos aqui ja desembrulham "dados" para o resto
 * do app trabalhar direto com o tipo real, sem repetir esse detalhe em
 * cada componente.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  private desembrulhar<T>(resposta$: Observable<RespostaApi<T>>): Observable<T> {
    return resposta$.pipe(map((resposta) => resposta.dados as T));
  }

  // Produtos
  listarProdutos(): Observable<RespostaResumoProduto[]> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaResumoProduto[]>>(`${API_BASE_URL}/produtos`));
  }

  buscarProduto(id: string): Observable<RespostaDetalheProduto> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaDetalheProduto>>(`${API_BASE_URL}/produtos/${id}`));
  }

  criarProduto(payload: RequisicaoProduto): Observable<RespostaDetalheProduto> {
    return this.desembrulhar(this.http.post<RespostaApi<RespostaDetalheProduto>>(`${API_BASE_URL}/produtos`, payload));
  }

  atualizarProduto(id: string, payload: RequisicaoProduto): Observable<RespostaDetalheProduto> {
    return this.desembrulhar(this.http.put<RespostaApi<RespostaDetalheProduto>>(`${API_BASE_URL}/produtos/${id}`, payload));
  }

  // Contas
  listarContas(): Observable<RespostaConta[]> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaConta[]>>(`${API_BASE_URL}/contas`));
  }

  buscarContaPorCpf(cpf: string): Observable<RespostaConta> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaConta>>(`${API_BASE_URL}/contas/${cpf}`));
  }

  criarConta(payload: RequisicaoConta): Observable<RespostaConta> {
    return this.desembrulhar(this.http.post<RespostaApi<RespostaConta>>(`${API_BASE_URL}/contas`, payload));
  }

  // Aplicacoes
  listarAplicacoes(): Observable<RespostaAplicacao[]> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaAplicacao[]>>(`${API_BASE_URL}/aplicacoes`));
  }

  criarAplicacao(payload: RequisicaoAplicacao): Observable<RespostaAplicacao> {
    return this.desembrulhar(this.http.post<RespostaApi<RespostaAplicacao>>(`${API_BASE_URL}/aplicacoes`, payload));
  }

  // Observabilidade
  buscarStatusFila(): Observable<RespostaStatusFila> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaStatusFila>>(`${API_BASE_URL}/operacoes/fila`));
  }

  buscarStatusCache(): Observable<RespostaStatusCache> {
    return this.desembrulhar(this.http.get<RespostaApi<RespostaStatusCache>>(`${API_BASE_URL}/operacoes/cache`));
  }
}
