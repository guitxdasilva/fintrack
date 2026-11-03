"use client";

import { useState, useCallback } from "react";
import { Download, Copy, ArrowUpCircle, ArrowDownCircle, List, LayoutGrid, Upload, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { TransactionList } from "@/modules/transactions/components/TransactionList";
import { TransactionForm } from "@/modules/transactions/components/TransactionForm";
import { BulkDuplicateDialog } from "@/modules/transactions/components/BulkDuplicateDialog";
import { ImportDialog } from "@/modules/transactions/components/ImportDialog";
import {
  TransactionFilters,
  type FilterValues,
} from "@/modules/transactions/components/TransactionFilters";
import { Pagination } from "@/common/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { useTransactions } from "@/modules/transactions/hooks/useTransactions";
import { RecurringSuggestions } from "@/modules/recurrence/components/RecurringSuggestions";
import type { Transaction } from "@/types";

type ViewMode = "table" | "cards";

/** API query params for the active filters (empty filters are omitted). */
function filterParams(filters: FilterValues): Record<string, string> {
  const params: Record<string, string> = {
    month: String(filters.month),
    year: String(filters.year),
  };
  if (filters.type !== "ALL") params.type = filters.type;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.search) params.search = filters.search;
  if (filters.cardId) params.cardId = filters.cardId;
  if (filters.paid) params.paid = filters.paid;
  if (filters.isFixed) params.isFixed = filters.isFixed;
  if (filters.paymentType) params.paymentType = filters.paymentType;
  return params;
}

export default function TransactionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    type: "ALL",
    categoryId: "",
    search: "",
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    cardId: "",
    paid: "",
    isFixed: "",
    paymentType: "",
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("transactions-view") as ViewMode) || "table";
    }
    return "table";
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data, isLoading: loading } = useTransactions({
    ...filterParams(filters),
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });
  const transactions = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit, total: 0, totalPages: 1 };

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  function handleNewTransaction(type: "EXPENSE" | "INCOME") {
    setEditingTransaction(null);
    setDefaultType(type);
    setFormOpen(true);
  }

  function handleExport(format: "csv" | "pdf") {
    const params = new URLSearchParams({ ...filterParams(filters), format });

    window.open(`/api/transactions/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setImportOpen(true)} variant="outline" size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => setBulkDuplicateOpen(true)} variant="outline" size="lg">
            <Copy className="mr-2 h-4 w-4" />
            Duplicar Mês
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            onClick={() => handleNewTransaction("INCOME")}
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
          <Button
            onClick={() => handleNewTransaction("EXPENSE")}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
          <TooltipProvider>
            <div className="hidden md:flex items-center border rounded-lg p-0.5 self-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setViewMode("table");
                      localStorage.setItem("transactions-view", "table");
                    }}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lista</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setViewMode("cards");
                      localStorage.setItem("transactions-view", "cards");
                    }}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cards</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <RecurringSuggestions variant="banner" />

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <TransactionFilters onFilterChange={handleFilterChange} />
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <TransactionList
          transactions={transactions}
          loading={loading}
          onEdit={handleEdit}
          viewMode={viewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(field) => {
            if (field === sortBy) {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy(field);
              setSortOrder(field === "amount" ? "desc" : "asc");
            }
            setPage(1);
          }}
        />
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={handleLimitChange}
        />
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editingTransaction}
        defaultType={defaultType}
      />

      <BulkDuplicateDialog
        open={bulkDuplicateOpen}
        onOpenChange={setBulkDuplicateOpen}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
