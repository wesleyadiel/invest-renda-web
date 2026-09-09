import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../core/api.service';
import { EstadoCircuito, RespostaCotacaoDolar, StatusIntegracaoExterna } from '../core/models';

const INTERVALO_POLLING_MS = 3000;

@Component({
  selector: 'app-integracoes-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integracoes-pagina.component.html',
  styleUrl: './integracoes-pagina.component.css',
})
export class IntegracoesPaginaComponent implements OnInit, OnDestroy {
  status?: StatusIntegracaoExterna;
  cotacao?: RespostaCotacaoDolar;

  consultando = false;
  atualizandoStatus = false;
  alternandoHabilitado = false;
  alternandoSimulacao = false;

  mensagemErroStatus = '';
  mensagemErroCotacao = '';
  mensagemSucessoCotacao = '';

  ultimaAtualizacao?: Date;

  private assinaturaPolling?: Subscription;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.carregarStatus();
    // So o status entra em polling - a cotacao e consultada por demanda,
    // ja que com a simulacao de falha ativa cada tentativa custa ~3s de
    // retry (nao faz sentido disparar isso sozinho a cada poucos segundos).
    this.assinaturaPolling = interval(INTERVALO_POLLING_MS).subscribe(() => this.carregarStatus());
  }

  ngOnDestroy(): void {
    this.assinaturaPolling?.unsubscribe();
  }

  // "manual" evita que o polling automático (a cada 3s) fique piscando o
  // spinner do botão - só mostramos o feedback de carregamento quando o
  // proprio usuario clica em "Atualizar agora".
  carregarStatus(manual = false): void {
    if (manual) {
      this.atualizandoStatus = true;
    }
    this.api.buscarStatusIntegracaoExterna().subscribe({
      next: (status) => {
        this.status = status;
        this.mensagemErroStatus = '';
        this.ultimaAtualizacao = new Date();
        this.atualizandoStatus = false;
      },
      error: (err) => {
        this.mensagemErroStatus = this.extrairErro(err);
        this.atualizandoStatus = false;
      },
    });
  }

  consultarCotacao(): void {
    this.mensagemErroCotacao = '';
    this.mensagemSucessoCotacao = '';
    this.consultando = true;
    this.api.consultarCotacaoDolar().subscribe({
      next: (cotacao) => {
        this.cotacao = cotacao;
        this.mensagemSucessoCotacao = 'Cotação consultada com sucesso.';
        this.consultando = false;
        this.carregarStatus();
      },
      error: (err) => {
        this.mensagemErroCotacao = this.extrairErro(err);
        this.consultando = false;
        this.carregarStatus();
      },
    });
  }

  alternarHabilitado(evento: Event): void {
    const ativo = (evento.target as HTMLInputElement).checked;
    this.alternandoHabilitado = true;
    this.api.habilitarIntegracaoExterna(ativo).subscribe({
      next: (status) => {
        this.status = status;
        this.alternandoHabilitado = false;
      },
      error: (err) => {
        this.mensagemErroStatus = this.extrairErro(err);
        this.alternandoHabilitado = false;
        this.carregarStatus();
      },
    });
  }

  alternarSimulacao(evento: Event): void {
    const ativo = (evento.target as HTMLInputElement).checked;
    this.alternandoSimulacao = true;
    this.api.simularFalhaIntegracaoExterna(ativo).subscribe({
      next: (status) => {
        this.status = status;
        this.alternandoSimulacao = false;
      },
      error: (err) => {
        this.mensagemErroStatus = this.extrairErro(err);
        this.alternandoSimulacao = false;
        this.carregarStatus();
      },
    });
  }

  classeBadgeCircuito(estado: EstadoCircuito | undefined): string {
    switch (estado) {
      case 'OPEN':
        return 'badge badge-failed';
      case 'HALF_OPEN':
        return 'badge badge-pending';
      default:
        return 'badge badge-completed';
    }
  }

  private extrairErro(err: any): string {
    const corpo = err?.error;
    if (corpo?.erros?.length) {
      return corpo.erros.join('; ');
    }
    return corpo?.mensagem ?? 'Erro inesperado. A API está rodando e acessível em http://localhost:8080?';
  }
}
