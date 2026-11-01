# Valtrix V5.4

**Controle financeiro, planejamento e recuperação segura de conta.**

<img width="1365" height="602" alt="image" src="https://github.com/user-attachments/assets/88fa24c7-2c75-4a44-92ff-cd87a4033350" />

A Valtrix é uma aplicação web de organização financeira pessoal. Esta versão reúne os recursos existentes de movimentações, compras e reserva com ferramentas de planejamento, relatórios e gerenciamento da conta.

## Funcionalidades

### Controle financeiro
- Painel com visão geral de saldo, receitas, despesas e reserva.
- Cadastro e histórico de entradas e despesas.
- Registro de compras, identificando se o pagamento saiu do saldo disponível ou da reserva.
- Depósitos e retiradas da reserva.
- Histórico com descrições, categorias, valores e datas.

### Planejamento — V5
- Metas financeiras com valor desejado, valor acumulado, categoria e prazo.
- Orçamentos mensais por categoria.
- Cadastro de despesas recorrentes com frequência e próxima data de vencimento.
- Acompanhamento das informações de planejamento na aplicação.

### Relatórios
- Resumo financeiro e gráficos por categoria.
- Exportação de movimentações em CSV.
- Impressão do relatório pelo navegador; escolha **Salvar como PDF** no diálogo de impressão para gerar um PDF.

### Conta e segurança — V5.4
- Cadastro e login com Supabase Auth.
- Alteração de senha para usuário autenticado, informando a senha atual.
- Configuração de código pessoal de recuperação com seis dígitos.
- Recuperação de senha usando e-mail cadastrado e código pessoal, sem depender de link enviado por e-mail.
- O código é armazenado como hash com salt; a função limita tentativas de recuperação.
- A interface também oferece configurações da conta e opção de tema.

> **Importante sobre recuperação:** o usuário precisa configurar e guardar o código de recuperação antes de perder acesso à conta. O código não pode ser recuperado pelo sistema. Se ele não foi configurado ou foi perdido, o fluxo por código não poderá validar a identidade. O código de seis dígitos é uma proteção adicional, portanto mantenha-o em local privado e não o reutilize como PIN bancário.

## Tecnologias

- React 18 e JavaScript (ES Modules)
- Vite 6 e CSS
- Supabase Auth, PostgreSQL, Row Level Security (RLS) e Edge Functions
- Recharts e Lucide React
- Testes automatizados com `node:test`

## Estrutura principal

```text
valtrix/
├── src/                         # Interface, regras e persistência
├── tests/                       # Testes automatizados
├── public/                      # Arquivos públicos e logotipo
├── supabase/
│   ├── schema.sql               # Estrutura inicial e políticas RLS
│   ├── migrations-v5.sql        # Metas, orçamentos e despesas recorrentes
│   ├── migrations-password-recovery-code.sql
│   └── functions/
│       └── password-recovery-code/ # Edge Function de recuperação
├── .env.example
├── package.json
└── README.md
```

## Executar localmente

Requisitos: Node.js LTS e npm.

1. Extraia o projeto e abra no terminal a pasta que contém `package.json`.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env` e configure as credenciais públicas do seu projeto Supabase:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL
   ```

4. Inicie o ambiente local:

   ```bash
   npm run dev
   ```

5. Para gerar a versão de produção e executar os testes:

   ```bash
   npm run build
   npm test
   ```

Sem as variáveis do Supabase, os recursos compatíveis podem funcionar em modo local de demonstração; os recursos de conta e recuperação na nuvem exigem Supabase configurado.

## Configurar o Supabase

Faça isso no projeto Supabase correto, preferencialmente primeiro em um ambiente de teste. Antes de alterar um banco já utilizado, faça backup.

1. Abra o **SQL Editor** do Supabase.
2. Execute `supabase/schema.sql` para criar a estrutura base, caso ainda não exista.
3. Execute `supabase/migrations-v5.sql` para adicionar metas, orçamentos e despesas recorrentes.
4. Execute `supabase/migrations-password-recovery-code.sql` para criar as tabelas e a função de controle de tentativas da recuperação por código.
5. Em **Authentication → URL Configuration**, configure a URL local e a URL de produção nas URLs permitidas.

As tabelas financeiras usam `user_id` e políticas RLS para restringir os registros ao usuário correspondente. Não remova nem desative essas políticas para fazer a aplicação funcionar.

### Publicar a Edge Function de recuperação

A recuperação por código precisa da função `password-recovery-code` publicada no Supabase. Com a Supabase CLI instalada e vinculada ao projeto:

```bash
supabase functions deploy password-recovery-code
```

A função utiliza os secrets do ambiente Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Os secrets de servidor são gerenciados pelo Supabase; **nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em `.env` do Vite, no GitHub ou no frontend**.

Após publicar, teste em uma conta de teste: configure o código enquanto estiver autenticado, saia da conta e faça uma recuperação com o e-mail e o código cadastrados. Teste também código incorreto e limite de tentativas.

## Publicar na Netlify

1. Envie o código para um repositório privado ou público no GitHub, sem incluir `.env` ou credenciais secretas.
2. Na Netlify, importe o repositório.
3. Configure o comando de build como `npm run build` e o diretório de publicação como `dist`.
4. Se o projeto estiver dentro da subpasta `valtrix`, defina `valtrix` como **Base directory**; se o `package.json` estiver na raiz do repositório, deixe a base vazia.
5. Cadastre na Netlify as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave publicável do Supabase.
6. Faça o deploy e adicione o domínio Netlify em **Supabase → Authentication → URL Configuration → Redirect URLs**.
7. Publique e teste a Edge Function no Supabase separadamente; publicar o frontend na Netlify não publica a função.

## Boas práticas

- Nunca compartilhe senhas, códigos de recuperação ou chaves secretas.
- A chave `service_role` é exclusiva do servidor e nunca deve ser exposta no navegador.
- Ative e mantenha as políticas RLS nas tabelas que contêm dados de usuários.
- Faça backup do banco antes de executar migrações em produção.
- Teste cadastro, login, movimentações, compras, reserva, metas, orçamentos, relatórios e recuperação em uma conta de teste antes de liberar a versão.
- Os relatórios em PDF são gerados pelo recurso de impressão do navegador; a aparência pode variar conforme o navegador e as opções de impressão.

## Scripts disponíveis

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o servidor local do Vite |
| `npm run build` | Gera a aplicação em `dist/` |
| `npm run preview` | Visualiza localmente o build de produção |
| `npm test` | Executa os testes automatizados |
| `npm run test:finance` | Executa os testes das regras financeiras |

---

**Valtrix V5.4** — documentação consolidada da versão. Consulte este arquivo como referência principal do projeto.


### Publicar a função de recuperação de senha

Executar apenas a migração SQL não publica uma Edge Function. Depois de configurar o Supabase CLI e vincular este projeto ao projeto Supabase correto, publique a função a partir da pasta que contém `supabase/`:

```bash
supabase functions deploy password-recovery-code
```

Confirme em Supabase → Edge Functions que `password-recovery-code` aparece como implantada. A função usa `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` fornecidas pelo ambiente Supabase; nunca coloque a `service_role` no frontend. O arquivo `supabase/config.toml` desativa a validação JWT automática no gateway porque a recuperação precisa aceitar usuários deslogados; a ação de salvar/alterar código valida o token do usuário dentro da própria função.

Se aparecer “Failed to send a request to the Edge Function”, verifique se a função foi implantada no mesmo projeto indicado por `VITE_SUPABASE_URL`, se o nome está exatamente `password-recovery-code` e se a URL/chave anon do `.env` pertencem ao mesmo projeto.

---

🔗 **Portfólio online:** https://ibrunoodev.netlify.app/  
💻 **GitHub:** https://github.com/IBrunooDev  
🔗 **LinkedIn:** https://www.linkedin.com/in/brunocarus/  
✉️ **E-mail:** ibrunood3v@gmail.com

--

Desenvolvido por **Bruno Henrique | IBrunooDev**.  
© 2026 Bruno Henrique. Todos os direitos reservados.
