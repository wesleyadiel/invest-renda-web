import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../core/api.service';
import { RespostaConta, RespostaAplicacao, RequisicaoAplicacao, RespostaResumoProduto } from '../core/models';

const INTERVALO_POLLING_MS = 3000;

@Component({
  selector: 'app-aplicacoes-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aplicacoes-pagina.component.html',
  styleUrl: './aplicacoes-pagina.component.css',
})
export class AplicacoesPaginaComponent implements OnInit, OnDestroy {
  aplicacoes: RespostaAplicacao[] = [];
  contas: RespostaConta[] = [];
  produtos: RespostaResumoProduto[] = [];

  enviando = false;
  atualizandoLista = false;
  atualizandoReferencias = false;
  mensagemErro = '';
  mensagemSucesso = '';

  formulario: RequisicaoAplicacao = this.formularioVazio();

  private assinaturaPolling?: Subscription;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.carregarDadosReferencia();
    this.carregarAplicacoes();
    // A aplicacao e processada de forma assincrona pela fila - o polling e
    // o jeito mais simples de ver o status sair de PENDENTE nesta tela.
    this.assinaturaPolling = interval(INTERVALO_POLLING_MS).subscribe(() => this.carregarAplicacoes());
  }

  ngOnDestroy(): void {
    this.assinaturaPolling?.unsubscribe();
  }

  carregarDadosReferencia(): void {
    this.atualizandoReferencias = true;
    let pendentes = 2;
    const concluiuUma = () => {
      pendentes -= 1;
      if (pendentes === 0) {
        this.atualizandoReferencias = false;
      }
    };
    this.api.listarContas().subscribe((contas) => {
      this.contas = contas;
      concluiuUma();
    });
    this.api.listarProdutos().subscribe((produtos) => {
      this.produtos = produtos;
      concluiuUma();
    });
  }

  // "manual" evita que o polling automático (a cada 3s) fique piscando o
  // spinner do botão - só mostramos o feedback de carregamento quando o
  // proprio usuario clica em "Atualizar agora".
  carregarAplicacoes(manual = false): void {
    if (manual) {
      this.atualizandoLista = true;
    }
    this.api.listarAplicacoes().subscribe({
      next: (aplicacoes) => {
        this.aplicacoes = aplicacoes;
        this.atualizandoLista = false;
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.atualizandoLista = false;
      },
    });
  }

  enviar(): void {
    this.limparMensagens();
    this.enviando = true;
    this.api.criarAplicacao(this.formulario).subscribe({
      next: () => {
        this.mensagemSucesso = 'Aplicação enviada para a fila. Acompanhe o status na tabela abaixo.';
        this.formulario = this.formularioVazio();
        this.enviando = false;
        this.carregarAplicacoes();
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.enviando = false;
      },
    });
  }

  classeBadge(status: string): string {
    switch (status) {
      case 'CONCLUIDA':
        return 'badge badge-completed';
      case 'FALHOU':
        return 'badge badge-failed';
      default:
        return 'badge badge-pending';
    }
  }

  private formularioVazio(): RequisicaoAplicacao {
    return { cpf: '', produtoId: '', valor: 0 };
  }

  private limparMensagens(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  private extrairErro(err: any): string {
    const corpo = err?.error;
    if (corpo?.erros?.length) {
      return corpo.erros.join('; ');
    }
    return corpo?.mensagem ?? 'Erro inesperado. A API está rodando e acessível em http://localhost:8080?';
  }
}
