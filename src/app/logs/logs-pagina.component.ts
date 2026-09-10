import { CommonModule } from '@angular/common';
import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '../core/api-config';
import { LinhaLog } from '../core/models';

const LIMITE_LINHAS = 300;
const LIMIAR_AUTO_SCROLL_PX = 40;

@Component({
  selector: 'app-logs-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs-pagina.component.html',
  styleUrl: './logs-pagina.component.css',
})
export class LogsPaginaComponent implements OnInit, OnDestroy {
  @ViewChild('console') consoleEl?: ElementRef<HTMLDivElement>;

  linhas: LinhaLog[] = [];
  conectado = false;
  filtro = '';

  private eventSource?: EventSource;

  constructor(private readonly zone: NgZone) {}

  // EventSource e uma API nativa do browser que o Zone.js nao intercepta -
  // sem rodar dentro da zone, o Angular nunca saberia que precisa refazer o
  // change detection depois de cada evento, e a tela ficaria travada mesmo
  // com os dados do componente ja atualizados por baixo dos panos.
  ngOnInit(): void {
    this.eventSource = new EventSource(`${API_BASE_URL}/operacoes/logs/stream`);
    this.eventSource.onopen = () => this.zone.run(() => (this.conectado = true));
    this.eventSource.onerror = () => this.zone.run(() => (this.conectado = false));
    this.eventSource.onmessage = (evento) => this.zone.run(() => this.receberLinha(evento.data));
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
  }

  get linhasFiltradas(): LinhaLog[] {
    if (!this.filtro.trim()) {
      return this.linhas;
    }
    const termo = this.filtro.toLowerCase();
    return this.linhas.filter((linha) => JSON.stringify(linha).toLowerCase().includes(termo));
  }

  limpar(): void {
    this.linhas = [];
  }

  classeNivel(level: string): string {
    switch (level) {
      case 'ERROR':
        return 'nivel-error';
      case 'WARN':
        return 'nivel-warn';
      case 'DEBUG':
        return 'nivel-debug';
      default:
        return 'nivel-info';
    }
  }

  private receberLinha(dados: string): void {
    try {
      const linha = JSON.parse(dados) as LinhaLog;
      const permaneceNoFinal = this.estaProximoDoFinal();
      this.linhas.push(linha);
      if (this.linhas.length > LIMITE_LINHAS) {
        this.linhas.shift();
      }
      if (permaneceNoFinal) {
        setTimeout(() => this.rolarParaFinal());
      }
    } catch {
      // linha que nao vier em JSON valido e descartada - nao deveria
      // acontecer (o backend so envia o que o LogstashEncoder produziu).
    }
  }

  private estaProximoDoFinal(): boolean {
    const el = this.consoleEl?.nativeElement;
    if (!el) {
      return true;
    }
    return el.scrollHeight - el.scrollTop - el.clientHeight < LIMIAR_AUTO_SCROLL_PX;
  }

  private rolarParaFinal(): void {
    const el = this.consoleEl?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
