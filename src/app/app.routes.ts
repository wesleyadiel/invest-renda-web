import { Routes } from '@angular/router';
import { InicioPaginaComponent } from './inicio/inicio-pagina.component';
import { ProdutosPaginaComponent } from './produtos/produtos-pagina.component';
import { ContasPaginaComponent } from './contas/contas-pagina.component';
import { AplicacoesPaginaComponent } from './aplicacoes/aplicacoes-pagina.component';
import { OperacoesPaginaComponent } from './operacoes/operacoes-pagina.component';
import { IntegracoesPaginaComponent } from './integracoes/integracoes-pagina.component';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: InicioPaginaComponent },
  { path: 'produtos', component: ProdutosPaginaComponent },
  { path: 'contas', component: ContasPaginaComponent },
  { path: 'aplicacoes', component: AplicacoesPaginaComponent },
  { path: 'operacoes', component: OperacoesPaginaComponent },
  { path: 'integracoes', component: IntegracoesPaginaComponent },
  { path: '**', redirectTo: 'inicio' },
];
