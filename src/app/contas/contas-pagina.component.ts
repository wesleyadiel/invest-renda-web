import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { RespostaConta, RequisicaoConta } from '../core/models';

@Component({
  selector: 'app-contas-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contas-pagina.component.html',
  styleUrl: './contas-pagina.component.css',
})
export class ContasPaginaComponent implements OnInit {
  contas: RespostaConta[] = [];
  carregando = false;
  salvando = false;
  confirmandoExclusaoCpf: string | null = null;
  excluindoCpf: string | null = null;
  mensagemErro = '';
  mensagemSucesso = '';

  formulario: RequisicaoConta = this.formularioVazio();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.carregarContas();
  }

  carregarContas(): void {
    this.carregando = true;
    this.api.listarContas().subscribe({
      next: (contas) => {
        this.contas = contas;
        this.carregando = false;
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.carregando = false;
      },
    });
  }

  enviar(): void {
    this.limparMensagens();
    this.salvando = true;
    this.api.criarConta(this.formulario).subscribe({
      next: (conta) => {
        this.mensagemSucesso = `Conta criada para o CPF ${conta.cpf}.`;
        this.salvando = false;
        this.formulario = this.formularioVazio();
        this.carregarContas();
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.salvando = false;
      },
    });
  }

  pedirConfirmacaoExclusao(conta: RespostaConta): void {
    this.limparMensagens();
    this.confirmandoExclusaoCpf = conta.cpf;
  }

  cancelarExclusao(): void {
    this.confirmandoExclusaoCpf = null;
  }

  confirmarExclusao(conta: RespostaConta): void {
    this.excluindoCpf = conta.cpf;
    this.api.excluirConta(conta.cpf).subscribe({
      next: () => {
        this.mensagemSucesso = 'Conta excluída.';
        this.excluindoCpf = null;
        this.confirmandoExclusaoCpf = null;
        this.carregarContas();
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.excluindoCpf = null;
        this.confirmandoExclusaoCpf = null;
      },
    });
  }

  private formularioVazio(): RequisicaoConta {
    return { cpf: '', nomeTitular: '', saldoInicial: 0 };
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
