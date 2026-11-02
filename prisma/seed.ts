import "dotenv/config";
import { PrismaClient, TransactionType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { dateOnly, parseDateOnly } from "../src/lib/dates";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@fintrack.com" },
    update: {},
    create: {
      name: "Usuário Demo",
      email: "demo@fintrack.com",
      password: hashedPassword,
    },
  });

  console.log("✅ Usuário demo criado:", user.email);

  const categories = [
    { name: "Salário", type: TransactionType.INCOME, color: "#22c55e", icon: "💰" },
    { name: "Freelance", type: TransactionType.INCOME, color: "#10b981", icon: "💻" },
    { name: "Investimentos", type: TransactionType.INCOME, color: "#14b8a6", icon: "📈" },
    { name: "Alimentação", type: TransactionType.EXPENSE, color: "#ef4444", icon: "🍔" },
    { name: "Transporte", type: TransactionType.EXPENSE, color: "#f97316", icon: "🚗" },
    { name: "Moradia", type: TransactionType.EXPENSE, color: "#8b5cf6", icon: "🏠" },
    { name: "Lazer", type: TransactionType.EXPENSE, color: "#ec4899", icon: "🎮" },
    { name: "Saúde", type: TransactionType.EXPENSE, color: "#06b6d4", icon: "🏥" },
    { name: "Educação", type: TransactionType.EXPENSE, color: "#3b82f6", icon: "📚" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name_userId: { name: cat.name, userId: user.id } },
      update: {},
      create: {
        ...cat,
        userId: user.id,
      },
    });
  }

  console.log("✅ Categorias criadas:", categories.length);

  const dbCategories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  const getCategoryId = (name: string) =>
    dbCategories.find((c) => c.name === name)?.id ?? dbCategories[0].id;

  const transactions = [
    { amount: 8500, type: TransactionType.INCOME, description: "Salário mensal", category: "Salário", daysAgo: 5 },
    { amount: 2000, type: TransactionType.INCOME, description: "Projeto freelance", category: "Freelance", daysAgo: 10 },
    { amount: 1200, type: TransactionType.EXPENSE, description: "Aluguel", category: "Moradia", daysAgo: 3 },
    { amount: 450, type: TransactionType.EXPENSE, description: "Supermercado", category: "Alimentação", daysAgo: 2 },
    { amount: 200, type: TransactionType.EXPENSE, description: "Uber e transporte", category: "Transporte", daysAgo: 4 },
    { amount: 150, type: TransactionType.EXPENSE, description: "Streaming e jogos", category: "Lazer", daysAgo: 7 },
    { amount: 300, type: TransactionType.EXPENSE, description: "Consulta médica", category: "Saúde", daysAgo: 15 },
    { amount: 500, type: TransactionType.EXPENSE, description: "Curso online", category: "Educação", daysAgo: 20 },
    { amount: 8500, type: TransactionType.INCOME, description: "Salário mensal", category: "Salário", daysAgo: 35 },
    { amount: 350, type: TransactionType.EXPENSE, description: "Restaurante", category: "Alimentação", daysAgo: 38 },
    { amount: 1200, type: TransactionType.EXPENSE, description: "Aluguel", category: "Moradia", daysAgo: 33 },
  ];

  for (const tx of transactions) {
    const now = new Date();
    const date = dateOnly(now.getFullYear(), now.getMonth(), now.getDate() - tx.daysAgo);

    await prisma.transaction.create({
      data: {
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        date,
        userId: user.id,
        categoryId: getCategoryId(tx.category),
      },
    });
  }

  console.log("✅ Transações demo criadas:", transactions.length);

  await prisma.goal.createMany({
    data: [
      {
        name: "Reserva de emergência",
        targetAmount: 30000,
        currentAmount: 12500,
        deadline: parseDateOnly("2026-12-31"),
        userId: user.id,
      },
      {
        name: "Viagem para Europa",
        targetAmount: 15000,
        currentAmount: 5000,
        deadline: parseDateOnly("2027-06-01"),
        userId: user.id,
      },
      {
        name: "Notebook novo",
        targetAmount: 8000,
        currentAmount: 6800,
        deadline: parseDateOnly("2026-04-01"),
        userId: user.id,
      },
    ],
  });

  console.log("✅ Metas demo criadas: 3");
  console.log("\n🎉 Seed concluído! Use: demo@fintrack.com / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
