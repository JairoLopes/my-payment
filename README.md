Sistema de Pagamento Stripe com Vue.js e Vercel Serverless
Este projeto é um sistema de pagamento completo, seguro e modular, projetado para ser facilmente reutilizável para múltiplos clientes. Ele demonstra uma arquitetura moderna e escalável, utilizando Vue.js no frontend e uma Vercel Serverless Function no backend para processar pagamentos com a Stripe.

A principal característica deste projeto é a sua robusta separação de responsabilidades, garantindo que as chaves de API secretas da sua conta Stripe nunca fiquem expostas no código do lado do cliente.

🏗️ A Arquitetura do Projeto
O projeto é dividido em duas partes que trabalham de forma coesa:

Frontend (Vue.js): A interface visual que o cliente interage. Sua única responsabilidade é coletar os dados do pagamento de forma segura e iniciar a transação.

Backend (Vercel Serverless Function): A lógica sensível de processamento do pagamento. É o único local que acessa e utiliza a chave secreta da Stripe.

Essa divisão garante a segurança do projeto, pois o frontend só conhece a chave pública do Stripe (pk_live_...), enquanto a chave secreta (sk_live_...) é armazenada de forma segura nas variáveis de ambiente da Vercel, longe do alcance do público.

🔑 Segurança e Reutilização
Este projeto foi construído com a reutilização em mente. Para cada novo cliente, você não precisa recriar toda a lógica do zero. Apenas siga o processo de configuração abaixo para garantir que a segurança seja mantida e que as informações de cada cliente permaneçam isoladas.

Como Reutilizar o Projeto para um Novo Cliente
Para cada novo cliente, a sua prioridade é a segurança. Siga este processo para garantir que as chaves de pagamento de cada cliente fiquem isoladas e seguras.

Passo 1: Obtenha as Chaves da Conta Stripe do Novo Cliente
Seu novo cliente deve ter uma conta no Stripe e fornecer a você duas chaves:

Chave Pública (Publishable Key): Começa com pk_live_... ou pk_test_....

Chave Secreta (Secret Key): Começa com sk_live_... ou sk_test_....

Passo 2: Configure o Backend no Vercel (Essencial para Segurança)
Para cada novo cliente, crie um novo projeto no Vercel. Isso garante que as chaves secretas não se misturem e que cada backend seja independente.

Crie um Novo Repositório no GitHub: Duplique este projeto em um novo repositório no GitHub para o seu cliente.

Importe para o Vercel: No seu painel do Vercel, importe o novo repositório.

Adicione a Nova Chave Secreta: Durante a configuração, adicione a chave secreta do Stripe do seu novo cliente como uma Variável de Ambiente com o nome STRIPE_SECRET_KEY.

Passo 3: Atualize o Frontend
A única alteração que você precisa fazer no código do projeto é a chave pública.

Abra o arquivo de configuração do frontend: src/config.ts.

Altere o valor da constante STRIPE_PUBLIC_KEY para a chave pública (pk_live_...) do seu novo cliente.

TypeScript

// src/config.ts

// Mude o valor da chave pública para o novo cliente
export const STRIPE_PUBLIC_KEY = 'pk_live_nova_chave_publica';
Faça o commit e push da alteração para o novo repositório.

O Vercel irá detectar a mudança, implantar o novo frontend e backend com as chaves corretas, e o projeto estará pronto para o novo cliente, de forma segura e eficiente.

🗄️ Estrutura de Arquivos
.
├── api/
│   └── create-payment-intent.ts         # Lógica do backend (Stripe e Vercel)
├── src/
│   ├── components/
│   │   ├── HeroBanner.vue
│   │   └── PaymentForm.vue              # Formulário de pagamento (Stripe Elements)
│   ├── App.vue                          # Componente raiz da aplicação
│   └── config.ts                        # Arquivo de configuração para a chave pública do Stripe
├── .gitignore
├── index.html
├── package.json
└── vite.config.ts
🚀 Como Executar o Projeto
Pré-requisitos
Node.js (versão 14 ou superior)

Conta no Vercel (para deploy do backend)

Conta no Stripe (para processar pagamentos)

Configuração Inicial
Clone o Repositório:

Instale as Dependências:


npm install
Deploy no Vercel:
Este projeto é otimizado para a Vercel. Siga as instruções no seu dashboard do Vercel para importar o repositório e configurar as variáveis de ambiente com a sua STRIPE_SECRET_KEY.
