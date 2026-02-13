# 💰 FinTrack — Dashboard Financeiro Pessoal

<p align="center">
  <strong>Controle suas finanças com dashboard interativo, gráficos, categorias e metas.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## ✨ Funcionalidades

| Feature | Descrição |
|---------|-----------|
| 🔐 **Autenticação** | Login e registro seguros com NextAuth.js (JWT + Credentials) |
| 📊 **Dashboard** | Visão geral com saldo, gráficos e transações do mês agrupadas por cartão |
| 💸 **Transações** | CRUD completo com filtros, busca, duplicação em massa e exportação CSV |
| 💳 **Cartões** | Cartões personalizáveis (Nubank, Inter, etc.) com tipo crédito/débito |
| 💰 **Formas de Pagamento** | Tipos fixos: Dinheiro, PIX, Cartão, Transferência e Boleto |
| 🏷️ **Categorias** | Categorias personalizáveis com emojis e cores |
| 🎯 **Metas** | Acompanhamento de progresso com barras visuais e status automático |
| 🌙 **Dark Mode** | Tema claro/escuro com persistência em localStorage |
| 📱 **Responsivo** | Layout adaptativo para desktop, tablet e mobile |

## 🛠️ Tech Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Componentes** | shadcn/ui (new-york), Recharts |
| **Backend** | Next.js API Routes, Zod validation |
| **Banco de Dados** | PostgreSQL (Neon) com Prisma ORM v7 |
| **Autenticação** | NextAuth.js v5 (beta) |
| **Deploy** | Vercel |

## 📁 Estrutura do Projeto

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login e Registro
│   ├── (dashboard)/            # Páginas protegidas
│   │   ├── dashboard/          # Visão geral
│   │   ├── transactions/       # Transações
│   │   ├── categories/         # Categorias
│   │   ├── cards/              # Cartões
│   │   └── goals/              # Metas financeiras
│   └── api/                    # API Routes (REST)
│       ├── auth/               # Login, registro
│       ├── cards/              # CRUD de cartões
│       ├── categories/         # CRUD de categorias
│       ├── dashboard/          # Dados agregados do dashboard
│       ├── goals/              # CRUD de metas
│       └── transactions/       # CRUD, duplicação, exportação CSV
├── common/
│   ├── components/
│   │   ├── layout/             # Sidebar, Header
│   │   └── ui/                 # Componentes shadcn/ui
│   ├── contexts/               # ThemeContext (dark mode)
│   └── hooks/                  # useDebounce, useMediaQuery, useMobile
├── lib/                        # Auth config, Prisma client, utils
├── modules/                    # Feature modules
│   ├── auth/                   # LoginForm, RegisterForm
│   ├── cards/                  # CardForm
│   ├── categories/             # CategoryForm
│   ├── dashboard/              # BalanceCard, ExpenseChart, MonthTransactions
│   ├── goals/                  # GoalCard, GoalForm, GoalProgress
│   └── transactions/           # TransactionForm, TransactionFilters, TransactionList
└── types/                      # TypeScript interfaces e constantes de pagamento
```

## ⚡ Como Rodar

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta no [Neon](https://neon.tech))

### Setup

```bash
# Clone o repositório
git clone https://github.com/guitxdasilva/fintrack.git
cd fintrack

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### Variáveis de Ambiente

```env
# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/fintrack?schema=public"

# NEXTAUTH
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### Rodando

```bash
# Gere o Prisma Client
npx prisma generate

# Rode as migrations
npx prisma migrate dev

# (Opcional) Popule com dados de exemplo
npx prisma db seed

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## 📦 Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npx prisma studio` | Interface visual do banco de dados |
| `npx prisma migrate dev` | Executar migrations |
| `npx prisma db seed` | Popular banco com dados demo |

## 📄 Licença

MIT

---

Feito por [Guilherme da Silva](https://github.com/guitxdasilva)
