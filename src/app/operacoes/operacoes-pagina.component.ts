import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../core/api.service';
import { RespostaStatusCache, RespostaStatusFila } from '../core/models';

const INTERVALO_POLLING_MS = 2000;

@Component({
  selector: 'app-operacoes-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operacoes-pagina.component.html',
  styleUrl: './operacoes-pagina.component.css',
})
export class OperacoesPaginaComponent implements OnInit, OnDestroy {
  statusFila?: RespostaStatusFila;
  statusCache?: RespostaStatusCache;
  mensagemErro = '';
  ultimaAtualizacao?: Date;

  private assinaturaPolling?: Subscription;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.atualizar();
    this.assinaturaPolling = interval(INTERVALO_POLLING_MS).subscribe(() => this.atualizar());
  }

  ngOnDestroy(): void {
    this.assinaturaPolling?.unsubscribe();
  }

  atualizar(): void {
    this.api.buscarStatusFila().subscribe({
      next: (status) => {
        this.statusFila = status;
        this.mensagemErro = '';
        this.ultimaAtualizacao = new Date();
      },
      error: (err) => (this.mensagemErro = this.extrairErro(err)),
    });
    this.api.buscarStatusCache().subscribe({
      next: (status) => (this.statusCache = status),
      error: (err) => (this.mensagemErro = this.extrairErro(err)),
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
