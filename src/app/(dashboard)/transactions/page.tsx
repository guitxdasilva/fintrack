"use client";

import { Suspense, useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Copy,
  CreditCard,
  FileSpreadsheet,
  FileText,
  List,
  MoreHorizontal,
  Pin,
  Upload,
  Wallet,
} from "lucide-react";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";
import { MonthNavigator, type MonthValue } from "@/common/components/MonthNavigator";
import {
  TransactionForm,
  type TransactionDefaults,
} from "@/modules/transactions/components/TransactionForm";
import { BulkDuplicateDialog } from "@/modules/transactions/components/BulkDuplicateDialog";
import { ImportDialog } from "@/modules/transactions/components/ImportDialog";
import type { FilterValues } from "@/modules/transactions/components/TransactionFilters";
import { AllView, filterParams } from "@/modules/transactions/components/views/AllView";
import { ALL_CARDS, CardsView } from "@/modules/transactions/components/views/CardsView";
import { FixedView } from "@/modules/transactions/components/views/FixedView";
import { OthersView } from "@/modules/transactions/components/views/OthersView";
import { RecurringSuggestions } from "@/modules/recurrence/components/RecurringSuggestions";
import type { Transaction, TransactionType } from "@/types";

const VIEWS = [
  { value: "all", label: "Todas", icon: List },
  { value: "cards", label: "Cartões", icon: CreditCard },
  { value: "fixed", label: "Fixas", icon: Pin },
  { value: "others", label: "Avulsas", icon: Wallet },
] as const;

type View = (typeof VIEWS)[number]["value"];

const isView = (value: string | null): value is View => VIEWS.some((v) => v.value === value);

function TransactionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The active tab and card live in the URL (?view=cards&card=...) so they can be linked.
  const viewParam = searchParams.get("view");
  const view: View = isView(viewParam) ? viewParam : "all";
  const cardParam = searchParams.get("card");

  const setUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const [month, setMonth] = useState<MonthValue>(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const [allFilters, setAllFilters] = useState<FilterValues | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [newType, setNewType] = useState<TransactionType>("EXPENSE");
  const [newDefaults, setNewDefaults] = useState<TransactionDefaults | undefined>();
  const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  function openNew(type: TransactionType, defaults?: TransactionDefaults) {
    setEditing(null);
    setNewType(type);
    setNewDefaults(defaults);
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setNewDefaults(undefined);
    setFormOpen(true);
  }

  function handleExport(format: "csv" | "pdf") {
    const params = new URLSearchParams({
      ...filterParams(view === "all" ? allFilters : null, month),
      format,
    });
    window.open(`/api/transactions/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setImportOpen(true)} variant="outline" aria-label="Importar">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Mais ações">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">Mais</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setBulkDuplicateOpen(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar mês
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => openNew("INCOME")}
            aria-label="Nova Receita"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            <span className="sm:hidden">Receita</span>
            <span className="hidden sm:inline">Nova Receita</span>
          </Button>
          <Button
            onClick={() => openNew("EXPENSE")}
            aria-label="Nova Despesa"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            <span className="sm:hidden">Despesa</span>
            <span className="hidden sm:inline">Nova Despesa</span>
          </Button>
        </div>
      </div>

      <RecurringSuggestions variant="banner" />

      <Tabs value={view} onValueChange={(value) => setUrl({ view: value === "all" ? null : value })}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-fit">
            {VIEWS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="px-2 sm:px-3">
                <Icon aria-hidden className="hidden sm:block" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <MonthNavigator value={month} onChange={setMonth} />
        </div>

        <TabsContent value="all">
          <AllView month={month} onEdit={openEdit} onFiltersChange={setAllFilters} />
        </TabsContent>
        <TabsContent value="cards">
          <CardsView
            month={month}
            cardId={cardParam}
            onCardChange={(id) => setUrl({ card: id === ALL_CARDS ? null : id })}
            onEdit={openEdit}
            onNew={(defaults) => openNew("EXPENSE", defaults)}
          />
        </TabsContent>
        <TabsContent value="fixed">
          <FixedView month={month} onEdit={openEdit} onNew={openNew} />
        </TabsContent>
        <TabsContent value="others">
          <OthersView month={month} onEdit={openEdit} />
        </TabsContent>
      </Tabs>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
        defaultType={newType}
        defaults={newDefaults}
      />
      <BulkDuplicateDialog open={bulkDuplicateOpen} onOpenChange={setBulkDuplicateOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

export default function TransactionsPage() {
  // useSearchParams needs a Suspense boundary
  return (
    <Suspense>
      <TransactionsPageContent />
    </Suspense>
  );
}
