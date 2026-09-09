import { Routes } from '@angular/router';
import { ProdutosPaginaComponent } from './produtos/produtos-pagina.component';
import { ContasPaginaComponent } from './contas/contas-pagina.component';
import { AplicacoesPaginaComponent } from './aplicacoes/aplicacoes-pagina.component';
import { OperacoesPaginaComponent } from './operacoes/operacoes-pagina.component';

export const routes: Routes = [
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', component: ProdutosPaginaComponent },
  { path: 'contas', component: ContasPaginaComponent },
  { path: 'aplicacoes', component: AplicacoesPaginaComponent },
  { path: 'operacoes', component: OperacoesPaginaComponent },
  { path: '**', redirectTo: 'produtos' },
];
