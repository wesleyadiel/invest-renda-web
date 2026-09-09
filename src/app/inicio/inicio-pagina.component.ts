import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../core/api-config';

interface Passo {
  numero: number;
  titulo: string;
  descricao: string;
  rota: string;
}

interface Tecnologia {
  nome: string;
  porque: string;
}

interface GrupoTecnologia {
  titulo: string;
  itens: Tecnologia[];
}

@Component({
  selector: 'app-inicio-pagina',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio-pagina.component.html',
  styleUrl: './inicio-pagina.component.css',
})
export class InicioPaginaComponent {
  readonly urlSwagger = `${API_BASE_URL}/swagger-ui.html`;

  readonly passos: Passo[] = [
    {
      numero: 1,
      titulo: 'Cadastre um produto',
      descricao: 'Um CDB, LCI ou LCA — com taxa, prazo e valor mínimo de investimento.',
      rota: '/produtos',
    },
    {
      numero: 2,
      titulo: 'Abra uma conta',
      descricao: 'Vinculada a um CPF, com um saldo inicial para poder investir.',
      rota: '/contas',
    },
    {
      numero: 3,
      titulo: 'Faça uma aplicação',
      descricao: 'Escolha a conta e o produto, e diga quanto quer aplicar.',
      rota: '/aplicacoes',
    },
    {
      numero: 4,
      titulo: 'Acompanhe o processamento',
      descricao:
        'A aplicação nasce "PENDENTE" e vira "CONCLUÍDA" (ou "FALHOU") sozinha — um processo em segundo plano cuida disso.',
      rota: '/aplicacoes',
    },
    {
      numero: 5,
      titulo: 'Veja os bastidores',
      descricao: 'Fila, dead-letter queue e cache atualizando ao vivo, a cada poucos segundos.',
      rota: '/operacoes',
    },
    {
      numero: 6,
      titulo: 'Teste uma integração externa',
      descricao: 'Consulte a cotação do dólar e provoque falhas para ver o circuit breaker reagir.',
      rota: '/integracoes',
    },
  ];

  readonly tecnologias: GrupoTecnologia[] = [
    {
      titulo: 'Base da API',
      itens: [
        {
          nome: 'Java + Spring Boot',
          porque:
            'A dupla mais usada no Brasil para esse tipo de sistema: muita gente já sabe mexer, e resolve pronto boa parte do trabalho chato (organizar a aplicação, conversar com o banco, expor endpoints).',
        },
        {
          nome: 'PostgreSQL',
          porque:
            'Banco de dados relacional. Como uma aplicação sempre pertence a uma conta e a um produto, faz sentido guardar tudo em tabelas que entendem bem esse tipo de relação.',
        },
        {
          nome: 'Flyway',
          porque:
            'Cada alteração no banco fica registrada em um arquivo com número de versão — como um histórico do Git, mas para a estrutura das tabelas. Todo mundo sobe o projeto com o banco no mesmo estado, sem passo manual.',
        },
      ],
    },
    {
      titulo: 'Desempenho e processamento',
      itens: [
        {
          nome: 'Redis (cache)',
          porque:
            'Produtos são lidos muito mais do que são alterados. Guardamos a lista e os detalhes em cache por alguns minutos pra responder mais rápido e aliviar o banco — contas e aplicações mudam o tempo todo, por isso não entram nessa.',
        },
        {
          nome: 'RabbitMQ (fila)',
          porque:
            'Ao criar uma aplicação, o saldo não é debitado na hora: o pedido entra numa fila e um processo separado confere e efetiva. Isso evita duas aplicações da mesma conta disputarem o mesmo saldo ao mesmo tempo, e se algo falhar, o pedido não se perde — vai para uma fila de erro pra ser investigado.',
        },
        {
          nome: 'Resilience4j',
          porque:
            'Usado na única chamada que a API faz pra fora (cotação do dólar). Se a chamada externa falhar, ele tenta de novo sozinho algumas vezes, esperando um pouco mais a cada tentativa — e se continuar falhando, para de tentar por um tempo, pra não travar a API esperando um serviço que caiu.',
        },
      ],
    },
    {
      titulo: 'Como tudo roda',
      itens: [
        {
          nome: 'Docker',
          porque:
            'Empacota a API e tudo que ela depende (banco, fila, cache) em containers prontos. Em vez de instalar cada peça manualmente, um único comando sobe o ambiente inteiro, do mesmo jeito em qualquer computador.',
        },
        {
          nome: 'Swagger / OpenAPI',
          porque:
            'Gera automaticamente uma página onde dá pra ver e testar todos os endpoints da API sem escrever nenhum código — é o link "Swagger UI" que aparece por aqui.',
        },
        {
          nome: 'Angular',
          porque:
            'É o que monta esta tela que você está vendo agora: organiza a interface em uma página por assunto (Produtos, Contas, Aplicações...) e fala com a API por HTTP. Maduro e com tudo incluso — formulário, rotas, chamadas HTTP — sem precisar juntar várias bibliotecas soltas.',
        },
      ],
    },
  ];
}
