# 💰 Finplanix — Dashboard Financeiro Pessoal

<p align="center">
  <strong>Controle suas finanças com dashboard interativo, gráficos, categorias, orçamento e metas.</strong>
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
| 🔑 **Recuperação de Senha** | Fluxo completo via email (Nodemailer + Gmail SMTP) com token seguro |
| 📊 **Dashboard** | Visão geral com saldo, gráficos, transações do mês agrupadas por cartão e orçamento |
| 💸 **Transações** | CRUD com filtros avançados (status, cartão, forma de pagamento, fixa/variável), busca, duplicação em massa e exportação CSV |
| 💳 **Cartões** | Cartões personalizáveis com dia de fechamento e acompanhamento de faturas |
| 💰 **Formas de Pagamento** | Dinheiro, PIX, Cartão, Transferência e Boleto |
| 🏷️ **Categorias** | Categorias personalizáveis com emojis e cores |
| 🐷 **Orçamento** | Limites de gastos por categoria com barras de progresso e alertas |
| 🎯 **Metas** | Acompanhamento de progresso com barras visuais e status automático |
| ⚙️ **Configurações** | Edição de perfil, redefinição de senha via email e exclusão de conta |
| 🎓 **Tour Guiado** | Onboarding interativo no primeiro acesso com driver.js (refazer a qualquer momento) |
| 🌙 **Dark Mode** | Tema claro/escuro com persistência em localStorage |
| 📱 **Responsivo** | Layout adaptativo para desktop, tablet e mobile |

## 🛠️ Tech Stack

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Componentes** | shadcn/ui (new-york), Recharts, driver.js |
| **Backend** | Next.js API Routes, Zod validation |
| **Banco de Dados** | PostgreSQL (Neon) com Prisma ORM v7 |
| **Autenticação** | NextAuth.js v5 (beta) |
| **Email** | Nodemailer 7 + Gmail SMTP |
| **Deploy** | Vercel |

## 📁 Estrutura do Projeto

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, Registro, Forgot/Reset Password
│   ├── (dashboard)/            # Páginas protegidas
│   │   ├── dashboard/          # Visão geral
│   │   ├── transactions/       # Transações (filtros avançados)
│   │   ├── categories/         # Categorias
│   │   ├── cards/              # Cartões
│   │   ├── budget/             # Orçamento por categoria
│   │   ├── goals/              # Metas financeiras
│   │   └── settings/           # Perfil e configurações
│   └── api/                    # API Routes (REST)
│       ├── auth/               # Login, registro, forgot/reset password, tour, profile
│       ├── budget/             # Orçamento por categoria
│       ├── cards/              # CRUD de cartões + faturas
│       ├── categories/         # CRUD de categorias
│       ├── dashboard/          # Dados agregados do dashboard
│       ├── goals/              # CRUD de metas
│       └── transactions/       # CRUD, duplicação, exportação CSV
├── common/
│   ├── components/
│   │   ├── layout/             # Sidebar, Header, PageTitle
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   ├── OnboardingTour.tsx  # Tour guiado (driver.js)
│   │   └── ThemeToggle.tsx     # Alternador de tema
│   ├── contexts/               # ThemeContext (dark mode)
│   └── hooks/                  # useDebounce, useMediaQuery, useMobile
├── lib/                        # Auth config, Prisma client, email utils
├── modules/                    # Feature modules
│   ├── auth/                   # LoginForm, RegisterForm, ForgotPassword, ResetPassword
│   ├── cards/                  # CardForm
│   ├── categories/             # CategoryForm
│   ├── dashboard/              # BalanceCard, ExpenseChart, MonthTransactions, BudgetOverview
│   ├── goals/                  # GoalCard, GoalForm, GoalProgress
│   └── transactions/           # TransactionForm, TransactionFilters, TransactionList
└── types/                      # TypeScript interfaces e constantes
```

## ⚡ Como Rodar

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta no [Neon](https://neon.tech))

### Setup

```bash
# Clone o repositório
git clone https://github.com/guitxdasilva/finplanix.git
cd finplanix

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### Variáveis de Ambiente

```env
# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/finplanix?schema=public"

# NEXTAUTH
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# EMAIL (Gmail SMTP — necessário para recuperação de senha)
SMTP_EMAIL="seu-email@gmail.com"
SMTP_PASSWORD="sua-app-password-gmail"
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
