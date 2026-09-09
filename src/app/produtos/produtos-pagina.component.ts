import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { RequisicaoProduto, RespostaResumoProduto, TipoProduto } from '../core/models';

@Component({
  selector: 'app-produtos-pagina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produtos-pagina.component.html',
  styleUrl: './produtos-pagina.component.css',
})
export class ProdutosPaginaComponent implements OnInit {
  readonly tiposProduto: TipoProduto[] = ['CDB', 'LCI', 'LCA'];

  produtos: RespostaResumoProduto[] = [];
  carregando = false;
  salvando = false;
  editandoId: string | null = null;
  carregandoDetalheId: string | null = null;
  confirmandoExclusaoId: string | null = null;
  excluindoId: string | null = null;
  mensagemErro = '';
  mensagemSucesso = '';

  formulario: RequisicaoProduto = this.formularioVazio();

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.api.listarProdutos().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.carregando = false;
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.carregando = false;
      },
    });
  }

  editar(produto: RespostaResumoProduto): void {
    this.limparMensagens();
    this.carregandoDetalheId = produto.id;
    this.api.buscarProduto(produto.id).subscribe({
      next: (detalhe) => {
        this.editandoId = detalhe.id;
        this.formulario = {
          nome: detalhe.nome,
          tipo: detalhe.tipo,
          emissor: detalhe.emissor,
          classificacaoEmissor: detalhe.classificacaoEmissor,
          taxaAnual: detalhe.taxaAnual,
          investimentoMinimo: detalhe.investimentoMinimo,
          prazoMeses: detalhe.prazoMeses,
          ativo: detalhe.ativo,
        };
        this.carregandoDetalheId = null;
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.carregandoDetalheId = null;
      },
    });
  }

  novoProduto(): void {
    this.limparMensagens();
    this.resetarFormulario();
  }

  pedirConfirmacaoExclusao(produto: RespostaResumoProduto): void {
    this.limparMensagens();
    this.confirmandoExclusaoId = produto.id;
  }

  cancelarExclusao(): void {
    this.confirmandoExclusaoId = null;
  }

  confirmarExclusao(produto: RespostaResumoProduto): void {
    this.excluindoId = produto.id;
    this.api.excluirProduto(produto.id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Produto excluído.';
        this.excluindoId = null;
        this.confirmandoExclusaoId = null;
        if (this.editandoId === produto.id) {
          this.resetarFormulario();
        }
        this.carregarProdutos();
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.excluindoId = null;
        this.confirmandoExclusaoId = null;
      },
    });
  }

  enviar(): void {
    this.limparMensagens();
    this.salvando = true;
    const requisicao$ = this.editandoId
      ? this.api.atualizarProduto(this.editandoId, this.formulario)
      : this.api.criarProduto(this.formulario);

    requisicao$.subscribe({
      next: () => {
        this.mensagemSucesso = this.editandoId ? 'Produto atualizado.' : 'Produto criado.';
        this.salvando = false;
        this.resetarFormulario();
        this.carregarProdutos();
      },
      error: (err) => {
        this.mensagemErro = this.extrairErro(err);
        this.salvando = false;
      },
    });
  }

  private resetarFormulario(): void {
    this.editandoId = null;
    this.formulario = this.formularioVazio();
  }

  private formularioVazio(): RequisicaoProduto {
    return {
      nome: '',
      tipo: 'CDB',
      emissor: '',
      classificacaoEmissor: '',
      taxaAnual: 0,
      investimentoMinimo: 0,
      prazoMeses: 12,
      ativo: true,
    };
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
