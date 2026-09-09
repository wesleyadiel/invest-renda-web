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
  editandoId: string | null = null;
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
      },
      error: (err) => (this.mensagemErro = this.extrairErro(err)),
    });
  }

  novoProduto(): void {
    this.limparMensagens();
    this.editandoId = null;
    this.formulario = this.formularioVazio();
  }

  enviar(): void {
    this.limparMensagens();
    const requisicao$ = this.editandoId
      ? this.api.atualizarProduto(this.editandoId, this.formulario)
      : this.api.criarProduto(this.formulario);

    requisicao$.subscribe({
      next: () => {
        this.mensagemSucesso = this.editandoId ? 'Produto atualizado.' : 'Produto criado.';
        this.novoProduto();
        this.carregarProdutos();
      },
      error: (err) => (this.mensagemErro = this.extrairErro(err)),
    });
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
