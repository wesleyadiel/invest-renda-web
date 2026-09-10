import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ItemFilaMorta, RespostaStatusCache, RespostaStatusFila } from '../core/models';

const INTERVALO_POLLING_MS = 2000;

@Component({
  selector: 'app-operacoes-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operacoes-pagina.component.html',
  styleUrl: './operacoes-pagina.component.css',
})
export class OperacoesPaginaComponent implements OnInit, OnDestroy {
  statusFila?: RespostaStatusFila;
  statusCache?: RespostaStatusCache;
  dlq: ItemFilaMorta[] = [];

  mensagemErro = '';
  mensagemErroDlq = '';
  mensagemSucessoDlq = '';
  ultimaAtualizacao?: Date;
  atualizando = false;
  alternandoSimulacaoFila = false;

  // valor digitado por aplicacaoId, so preenchido quando o usuario quer
  // ajustar antes de reprocessar - se vazio, reenvia o valor original.
  novosValores: Record<string, number | null> = {};
  reprocessando: Record<string, boolean> = {};

  private assinaturaPolling?: Subscription;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.atualizar();
    this.assinaturaPolling = interval(INTERVALO_POLLING_MS).subscribe(() => this.atualizar());
  }

  ngOnDestroy(): void {
    this.assinaturaPolling?.unsubscribe();
  }

  // "manual" evita que o polling automático (a cada 2s) fique piscando o
  // spinner do botão - só mostramos o feedback de carregamento quando o
  // proprio usuario clica em "Atualizar agora".
  atualizar(manual = false): void {
    if (manual) {
      this.atualizando = true;
    }
    this.api.buscarStatusFila().subscribe({
      next: (status) => {
        this.statusFila = status;
        this.mensagemErro = '';
        this.ultimaAtualizacao = new Date();
        this.atualizando = false;
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.atualizando = false;
      },
    });
    this.api.buscarStatusCache().subscribe({
      next: (status) => (this.statusCache = status),
      error: (err) => (this.mensagemErro = this.extrairErro(err)),
    });
    this.carregarDlq();
  }

  trackByAplicacaoId(_index: number, item: ItemFilaMorta): string {
    return item.aplicacaoId;
  }

  carregarDlq(): void {
    this.api.listarDlq().subscribe({
      next: (itens) => {
        this.dlq = itens;
        this.mensagemErroDlq = '';
      },
      error: (err) => (this.mensagemErroDlq = this.extrairErro(err)),
    });
  }

  alternarSimulacaoFila(evento: Event): void {
    const ativo = (evento.target as HTMLInputElement).checked;
    this.alternandoSimulacaoFila = true;
    this.api.simularFalhaFila(ativo).subscribe({
      next: (status) => {
        this.statusFila = status;
        this.alternandoSimulacaoFila = false;
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.alternandoSimulacaoFila = false;
        this.atualizar();
      },
    });
  }

  reprocessar(item: ItemFilaMorta): void {
    this.reprocessando[item.aplicacaoId] = true;
    this.mensagemErroDlq = '';
    this.mensagemSucessoDlq = '';

    const novoValor = this.novosValores[item.aplicacaoId];
    this.api.reprocessarDlq({ aplicacaoId: item.aplicacaoId, novoValor: novoValor ?? undefined }).subscribe({
      next: () => {
        this.mensagemSucessoDlq = `Aplicação ${item.aplicacaoId} reenviada para a fila principal.`;
        delete this.novosValores[item.aplicacaoId];
        this.reprocessando[item.aplicacaoId] = false;
        this.atualizar();
      },
      error: (err) => {
        this.mensagemErroDlq = this.extrairErro(err);
        this.reprocessando[item.aplicacaoId] = false;
      },
    });
  }

  private extrairErro(err: any): string {
    const corpo = err?.error;
    if (corpo?.erros?.length) {
      return corpo.erros.join('; ');
    }
    return corpo?.mensagem ?? 'Erro ao consultar status. A API está rodando e acessível em http://localhost:8080?';
  }
}
