# 💰 FinTrack - Dashboard Financeiro Pessoal

Dashboard financeiro pessoal com gráficos interativos, categorias inteligentes e metas financeiras. Controle suas receitas, despesas e acompanhe seus objetivos em tempo real.

## 🚀 Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** PostgreSQL com Prisma ORM v7
- **Autenticação:** NextAuth.js v5
- **Gráficos:** Chart.js + react-chartjs-2
- **Validação:** Zod

## 📁 Estrutura do Projeto

```
src/
├── app/          # Next.js App Router (páginas e API routes)
├── modules/      # Feature modules (auth, dashboard, transactions, etc.)
├── common/       # Componentes, hooks e contexts compartilhados
├── lib/          # Configurações (Prisma, Auth, utils)
├── types/        # Tipos TypeScript globais
└── generated/    # Prisma Client gerado
```

## ⚡ Como Rodar

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/fintrack.git
cd fintrack

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL e NEXTAUTH_SECRET

# 4. Gere o Prisma Client
npx prisma generate

# 5. Rode as migrations
npx prisma migrate dev

# 6. (Opcional) Popule com dados demo
npx prisma db seed

# 7. Inicie o servidor
npm run dev
```

## 🔑 Credenciais Demo

```
Email: demo@fintrack.com
Senha: demo123
```

## 📦 Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm start` | Servidor de produção |
| `npx prisma studio` | Interface visual do banco |
| `npx prisma migrate dev` | Executar migrations |
| `npx prisma db seed` | Popular banco com dados demo |

## 🗂️ Funcionalidades

- [x] Setup do projeto e estrutura modular
- [ ] Layout base (sidebar, header, tema dark/light)
- [ ] Autenticação (login/registro com NextAuth)
- [ ] CRUD de transações
- [ ] Dashboard com gráficos interativos
- [ ] Categorias, filtros e metas financeiras
- [ ] Responsividade e polimento final

## 📄 Licença

MIT
