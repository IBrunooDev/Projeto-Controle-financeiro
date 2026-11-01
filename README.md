# Valtrix V5.4

# A importância da IA nos estudos e no desenvolvimento de projetos

A inteligência artificial se tornou uma grande aliada no aprendizado e no desenvolvimento de projetos. Durante meus estudos e a criação do Valtrix, utilizei a IA como ferramenta de apoio para tirar dúvidas, entender conceitos, encontrar soluções para problemas e melhorar meu código.

O desenvolvimento do Valtrix – Controle Financeiro foi uma experiência importante para colocar em prática meus conhecimentos em programação. Durante o processo, enfrentei desafios na criação das funcionalidades, organização do sistema, interface e integração com banco de dados.

A IA ajudou a tornar esse processo mais produtivo, mas também foi importante estudar, testar e compreender cada implementação. Afinal, a IA não substitui o aprendizado: ela funciona como uma ferramenta que ajuda a evoluir.

**Minha experiência:** desenvolver o Valtrix me mostrou que aprender programação vai além de escrever código. É saber pesquisar, resolver problemas, testar ideias e transformar conhecimentos em um projeto real.

Aplicação web de **controle financeiro pessoal**, com movimentações, compras, reserva, planejamento, relatórios e gerenciamento seguro da conta.

<img width="1365" height="602" alt="image" src="https://github.com/user-attachments/assets/88fa24c7-2c75-4a44-92ff-cd87a4033350" />

> **Objetivo deste guia:** explicar, em ordem, como preparar o projeto, configurar o Supabase, executar localmente e publicar a aplicação. Siga as etapas na sequência para evitar erros de configuração.

---

## Índice

1. [O que a Valtrix oferece](#-o-que-a-valtrix-oferece)
2. [Requisitos](#-requisitos)
3. [1. Preparar o projeto](#1-preparar-o-projeto)
4. [2. Criar e configurar o Supabase](#2-criar-e-configurar-o-supabase)
5. [3. Configurar as variáveis de ambiente](#3-configurar-as-variáveis-de-ambiente)
6. [4. Executar no computador](#4-executar-no-computador)
7. [5. Publicar a recuperação de senha](#5-publicar-a-recuperação-de-senha)
8. [6. Publicar na Vercel](#6-publicar-na-vercel)
9. [7. Conferir se tudo está funcionando](#7-conferir-se-tudo-está-funcionando)
10. [Solução de problemas](#-solução-de-problemas)
11. [Segurança](#-segurança)
12. [Tecnologias e comandos](#-tecnologias-e-comandos)

---

## ✨ O que a Valtrix oferece

### Controle financeiro
- Painel com saldo, receitas, despesas e reserva.
- Cadastro e histórico de entradas e despesas.
- Registro de compras, com indicação se o pagamento saiu do saldo ou da reserva.
- Depósitos e retiradas da reserva.
- Histórico com descrições, categorias, valores e datas.

### Planejamento
- Metas financeiras com valor desejado, valor acumulado, categoria e prazo.
- Orçamentos mensais por categoria.
- Despesas recorrentes, com frequência e próxima data de vencimento.

### Relatórios
- Resumo financeiro e gráficos por categoria.
- Exportação de movimentações em CSV.
- Impressão do relatório pelo navegador. Para gerar um PDF, escolha **Salvar como PDF** na janela de impressão.

### Conta e segurança — V5.4
- Cadastro e login com Supabase Auth.
- Alteração de senha para usuário autenticado.
- Configuração de código pessoal de recuperação com seis dígitos.
- Recuperação de senha com e-mail e código pessoal.
- Proteção contra excesso de tentativas de recuperação.
- Configurações da conta e opção de tema.

**Atenção:** configure e guarde seu código de recuperação enquanto ainda tem acesso à conta. O sistema não consegue mostrar novamente um código perdido. Ele é uma proteção adicional e não deve ser reutilizado como PIN bancário.

---

## 🧰 Requisitos

Antes de começar, instale:

- **Node.js (versão LTS)** — inclui o npm.
- **Git**, caso vá enviar o projeto para o GitHub.
- Uma conta no **Supabase**.
- Uma conta na **Vercel**, caso queira publicar o site.
- **Supabase CLI**, necessária para publicar a função de recuperação de senha.

Confira se Node.js e npm estão instalados:

```bash
node -v
npm -v
```

Se os comandos mostrarem números de versão, está tudo certo.

---

## 1. Preparar o projeto

1. Extraia o arquivo ZIP para uma pasta do computador.
2. Abra a pasta principal extraída no VS Code.
3. Confira se nessa pasta aparecem `package.json`, `src/`, `public/` e `supabase/`.
4. Abra o terminal integrado do VS Code em **Terminal → Novo Terminal**.
5. Instale as dependências:

```bash
npm install
```

> **Importante sobre a pasta:** execute os comandos na raiz do projeto — a pasta que contém o `package.json` e a pasta `supabase/` completa. Não execute os comandos dentro de `src/` ou de outra subpasta.

---

## 2. Criar e configurar o Supabase

O Supabase armazena as contas e os dados financeiros na nuvem.

### 2.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com/) e entre na sua conta.
2. Crie um novo projeto.
3. Escolha um nome, uma senha forte para o banco e a região desejada.
4. Aguarde o projeto terminar de inicializar.
5. No painel do projeto, abra **Project Settings → API**.
6. Copie a **Project URL** e a chave publicável (**anon/public key**). Você usará esses dados na etapa 3.

Não compartilhe a senha do banco nem chaves secretas.

### 2.2 Criar as tabelas do banco

No painel do Supabase:

1. Abra **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase/schema.sql` que está no projeto.
4. Copie todo o conteúdo desse arquivo e cole no SQL Editor.
5. Clique em **Run** e aguarde a confirmação.

Esse arquivo cria as tabelas principais de movimentações, compras e reserva, além das políticas de segurança RLS.

### 2.3 Adicionar os recursos de planejamento

Repita o processo com o arquivo:

```text
supabase/migrations-v5.sql
```

Cole o conteúdo em uma nova consulta no SQL Editor e clique em **Run**. Essa migração cria as estruturas de metas, orçamentos e despesas recorrentes.

### 2.4 Adicionar a recuperação por código

Repita o processo com:

```text
supabase/migrations-password-recovery-code.sql
```

Execute o conteúdo no SQL Editor. Essa migração prepara as tabelas e o controle de tentativas usados na recuperação de senha.

**Ordem correta:** `schema.sql` → `migrations-v5.sql` → `migrations-password-recovery-code.sql`.

> Se o banco já estiver em uso, faça um backup antes de executar SQL. Não apague tabelas nem desative as políticas RLS para tentar corrigir problemas.

### 2.5 Configurar os endereços de autenticação

1. No Supabase, abra **Authentication → URL Configuration**.
2. Em **Site URL**, informe o endereço principal do site. Durante o desenvolvimento, pode usar `http://localhost:5173`.
3. Em **Redirect URLs**, adicione também `http://localhost:5173/**`.
4. Quando publicar na Vercel, volte aqui e adicione o endereço de produção e o padrão de retorno indicado na etapa 6.

---

## 3. Configurar as variáveis de ambiente

As variáveis conectam o frontend ao projeto Supabase.

1. Na raiz do projeto, localize o arquivo `.env.example`.
2. Faça uma cópia dele.
3. Renomeie a cópia para `.env` (sem `.example`).
4. Abra o `.env` e preencha com os dados copiados do Supabase:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL
```

Substitua os textos de exemplo pelos valores reais do seu projeto. Não coloque aspas e não deixe espaços antes ou depois do `=`.

**Não envie o arquivo `.env` para o GitHub.** O `.gitignore` do projeto deve mantê-lo fora do repositório.

Se quiser apenas conhecer a interface em modo demonstrativo, as duas variáveis podem ficar vazias. Nesse modo, os recursos que dependem de conta e nuvem não estarão disponíveis.

---

## 4. Executar no computador

Com as dependências instaladas e o `.env` configurado:

1. No terminal, confirme que está na raiz do projeto.
2. Execute:

```bash
npm run dev
```

3. O Vite mostrará um endereço local, normalmente:

```text
http://localhost:5173
```

4. Abra esse endereço no navegador.
5. Para encerrar o servidor, volte ao terminal e pressione `Ctrl + C`.

Sempre que alterar as variáveis do `.env`, pare e inicie novamente o servidor para carregar os novos valores.

### Gerar a versão de produção

Para verificar se o projeto compila corretamente:

```bash
npm run build
```

Os arquivos prontos para publicação serão gerados na pasta `dist/`.

Para visualizar localmente essa versão compilada:

```bash
npm run preview
```

---

## 5. Publicar a recuperação de senha

A recuperação por código usa uma **Supabase Edge Function**. Executar o SQL da etapa 2 não publica essa função; é necessário fazer o deploy separadamente.

### 5.1 Instalar e autenticar a Supabase CLI

Instale a Supabase CLI seguindo a documentação oficial:

[Documentação de instalação da Supabase CLI](https://supabase.com/docs/guides/cli)

Depois, no terminal, autentique-se:

```bash
supabase login
```

### 5.2 Vincular o projeto correto

No painel do Supabase, localize o **Project Reference** do projeto criado. No terminal, ainda na raiz do projeto, execute:

```bash
supabase link --project-ref SEU_PROJECT_REF
```

Troque `SEU_PROJECT_REF` pelo identificador real do seu projeto.

### 5.3 Fazer o deploy da função

Execute:

```bash
supabase functions deploy password-recovery-code
```

A configuração `supabase/config.toml` já define o comportamento de validação JWT dessa função. A própria função valida a sessão nas operações que exigem usuário autenticado.

O ambiente das Edge Functions fornece as variáveis padrão do Supabase, incluindo `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. **Nunca copie a chave `service_role` para o `.env` do Vite ou para o frontend.**

### 5.4 Confirmar a publicação

1. No painel do Supabase, abra **Edge Functions**.
2. Confirme que `password-recovery-code` aparece na lista.
3. Faça um teste com uma conta de teste: entre na conta, configure o código de recuperação, saia e tente recuperar a senha usando o e-mail e o código cadastrados.

---

## 6. Publicar na Vercel

A Vercel hospeda a versão online da Valtrix e pode publicar automaticamente sempre que você atualizar o repositório no GitHub.

### 6.1 Enviar o projeto ao GitHub

1. Crie um repositório no GitHub ou abra o repositório que já contém a Valtrix.
2. Envie os arquivos e pastas do projeto, mantendo o `package.json` na raiz do repositório.
3. Confira se `.env` não foi enviado. Envie apenas `.env.example`, sem valores reais ou secretos.
4. Não é necessário enviar a pasta `dist`: a Vercel gera essa pasta durante o build.

### 6.2 Importar o projeto na Vercel

1. Acesse [vercel.com](https://vercel.com/) e entre na sua conta.
2. Clique em **Add New → Project**.
3. Conecte sua conta GitHub, se ainda não estiver conectada.
4. Escolha o repositório da Valtrix e clique em **Import**.
5. Confira as configurações:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (ou o padrão detectado pela Vercel)
   - **Root Directory:** deixe na raiz do repositório, onde está o `package.json`.

### 6.3 Configurar as variáveis de ambiente

Antes de publicar, abra **Environment Variables** e adicione estas duas variáveis:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Project URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave publicável (anon/public) do Supabase |

Selecione os ambientes de publicação desejados, incluindo **Production**, e salve as variáveis. Não use a chave `service_role` no frontend.

Clique em **Deploy** e aguarde a conclusão. A Vercel executará o build e publicará automaticamente o conteúdo da pasta `dist`.

### 6.4 Atualizar o site depois de alterações

Depois de conectar o repositório, quando você enviar um novo commit para a branch de produção (normalmente `main`), a Vercel fará um novo deploy automaticamente. Se alterar variáveis de ambiente, faça um novo deploy para que elas sejam aplicadas ao build.

### 6.5 Autorizar o endereço publicado no Supabase

1. Copie o endereço de produção fornecido pela Vercel, por exemplo `https://seu-projeto.vercel.app`.
2. No Supabase, abra **Authentication → URL Configuration**.
3. Em **Site URL**, coloque o endereço principal da Vercel.
4. Em **Redirect URLs**, adicione também `https://seu-projeto.vercel.app/**` e mantenha `http://localhost:5173/**` para testes locais, se necessário.
5. Clique em **Save changes**.

A publicação do frontend na Vercel **não** publica a Supabase Edge Function. A função `password-recovery-code` precisa continuar implantada diretamente no Supabase, conforme a etapa 5.
---

## 7. Conferir se tudo está funcionando

Depois da configuração, faça os testes abaixo com uma conta de teste:

- [ ] O site abre sem erro.
- [ ] É possível criar uma conta e entrar.
- [ ] O painel carrega os dados.
- [ ] É possível registrar uma receita e uma despesa.
- [ ] É possível registrar uma compra.
- [ ] É possível depositar e retirar dinheiro da reserva.
- [ ] É possível criar uma meta financeira.
- [ ] É possível criar um orçamento mensal.
- [ ] É possível cadastrar uma despesa recorrente.
- [ ] Os relatórios são exibidos e a exportação CSV funciona.
- [ ] O código de recuperação pode ser configurado.
- [ ] A recuperação de senha funciona com o e-mail e o código corretos.
- [ ] Um código incorreto é recusado.

Também é possível executar os testes automatizados do projeto:

```bash
npm test
```

---

## 🛠️ Solução de problemas

### `npm` ou `node` não é reconhecido

O Node.js não está instalado ou o terminal não atualizou o PATH. Instale a versão LTS do Node.js, feche e abra o terminal e confira `node -v` e `npm -v`.

### O site abre, mas não conecta ao Supabase

- Confira se o arquivo se chama exatamente `.env`.
- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` pertencem ao mesmo projeto.
- Confira se não há espaços ou caracteres extras nos valores.
- Reinicie o `npm run dev` depois de alterar o `.env`.

### Erro ao recuperar senha ou chamar a Edge Function

- Confirme se a migração `migrations-password-recovery-code.sql` foi executada.
- Confirme se a função `password-recovery-code` aparece em **Supabase → Edge Functions**.
- Verifique se a função foi publicada no mesmo projeto indicado por `VITE_SUPABASE_URL`.
- Confira se o nome da função está exatamente igual a `password-recovery-code`.
- Consulte os logs da função no painel do Supabase.

### Login ou retorno de autenticação não funciona

Confira **Authentication → URL Configuration** e confirme que o endereço local ou o domínio da Vercel está cadastrado nas URLs permitidas.

### O deploy da Vercel falha

- Confira se o **Build Command** é `npm run build`.
- Confira se o **Output Directory** é `dist`.
- Verifique se o **Root Directory** aponta para a pasta que contém o `package.json`.
- Confira se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` foram cadastradas nos ambientes corretos.
- Abra os logs do deployment para identificar o primeiro erro apresentado.

---

## 🔐 Segurança

- Nunca publique senhas, tokens, códigos de recuperação ou arquivos `.env`.
- A chave `service_role` é secreta e deve permanecer somente no ambiente do servidor.
- Não desative as políticas **Row Level Security (RLS)** para contornar erros.
- Faça backup antes de executar alterações no banco de produção.
- Use contas de teste para validar mudanças antes de liberar a aplicação.
- Guarde o código de recuperação em local privado.

---

## 🧱 Tecnologias e comandos

**Tecnologias:** React 18, JavaScript (ES Modules), Vite 6, CSS, Supabase Auth, PostgreSQL, RLS, Edge Functions, Recharts, Lucide React e testes com `node:test`.

| Comando | Para que serve |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Visualiza o build localmente |
| `npm test` | Executa os testes automatizados |
| `npm run test:finance` | Executa os testes financeiros |

### Estrutura principal

```text
valtrix/
├── src/                              # Código da aplicação
│   ├── components/                   # Componentes da interface
│   └── lib/                          # Regras, armazenamento e Supabase
├── tests/                            # Testes automatizados
├── public/                           # Arquivos públicos e logotipo
├── supabase/
│   ├── schema.sql                    # Estrutura inicial e políticas RLS
│   ├── migrations-v5.sql             # Metas, orçamentos e recorrências
│   ├── migrations-password-recovery-code.sql
│   ├── config.toml                   # Configuração das Edge Functions
│   └── functions/
│       └── password-recovery-code/   # Função de recuperação de senha
├── .env.example                      # Modelo das variáveis de ambiente
├── package.json                      # Dependências e scripts
└── README.md                         # Este guia
```

---

**Valtrix V5.4** · Documentação de instalação, configuração e publicação.


---

🔗 **Portfólio online:** https://ibrunoodev.netlify.app/  
💻 **GitHub:** https://github.com/IBrunooDev  
🔗 **LinkedIn:** https://www.linkedin.com/in/brunocarus/  
✉️ **E-mail:** ibrunood3v@gmail.com

---

Desenvolvido por **Bruno Henrique | IBrunooDev**.  
© 2026 Bruno Henrique. Todos os direitos reservados.

