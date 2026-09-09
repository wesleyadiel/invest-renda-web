# invest-renda-web

Front-end simples em Angular (sem login, sem autenticação) para exercitar e
validar manualmente a [`invest-renda-api`](../invest-renda-api). Não é um
produto — é uma ferramenta de QA/demonstração.

## O que dá para fazer aqui

- **Produtos**: cadastrar, editar, excluir, listar e ver detalhe (`/produtos`).
- **Contas**: abrir conta por CPF com saldo inicial, listar, excluir e ver
  saldos (`/contas`). Excluir produto/conta com aplicações associadas é
  bloqueado pela API (422).
- **Aplicações**: aplicar em um produto e acompanhar o status
  (`PENDENTE` → `CONCLUIDA`/`FALHOU`) evoluindo em tempo real — o
  processamento é assíncrono via fila, a tela atualiza sozinha a cada 3s
  (`/aplicacoes`).
- **Fila & Cache**: estado ao vivo do RabbitMQ (mensagens na fila de
  aplicações e na dead-letter queue, consumidores ativos) e do Redis
  (produto/lista em cache e TTL restante), atualizando a cada 2s
  (`/operacoes`).
- **Integrações externas**: consulta sob demanda à cotação do dólar
  (chamada de exemplo protegida por Resilience4j), com dois toggles ao
  vivo — ligar/desligar a integração e forçar falha na próxima consulta —
  e o estado do circuit breaker (`CLOSED`/`OPEN`/`HALF_OPEN`), atualizando
  a cada 3s (`/integracoes`).

## Rodando

Pré-requisito: a `invest-renda-api` rodando e acessível (local via
`docker/run.sh` ou `mvn spring-boot:run` — ver `.specs/local-development.md`
no projeto da API). A URL da API é configurada em
`src/app/core/api-config.ts` (default `http://localhost:8080`).

```bash
npm install
npm start          # ng serve — abre em http://localhost:4200
```

Se a porta 4200 já estiver em uso por outro projeto seu, suba em outra:

```bash
npx ng serve --port 4201
```

A API já libera CORS para qualquer porta `localhost` (ver
`ConfiguracaoCors` na API), então não precisa reconfigurar nada ao trocar de
porta.

Documentação interativa de todos os endpoints da API (Swagger UI):
`http://localhost:8080/swagger-ui.html` — também acessível pelo link
"Swagger ↗" no topo de qualquer tela deste app.

## Stack

Angular 18, standalone components (sem `NgModule`), `HttpClient`, formulários
via `FormsModule`/`ngModel` (template-driven, não reativo — suficiente para
o tamanho dos formulários aqui). Sem Angular Material nem bibliotecas de UI:
CSS simples em `src/styles.css`.
