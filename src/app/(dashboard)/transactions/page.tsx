"use client";

import { useState, useCallback, useEffect } from "react";
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
import type { Transaction } from "@/types";

type ViewMode = "table" | "cards";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== "ALL") params.set("type", filters.type);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.search) params.set("search", filters.search);
      if (filters.cardId) params.set("cardId", filters.cardId);
      if (filters.paid) params.set("paid", filters.paid);
      if (filters.isFixed) params.set("isFixed", filters.isFixed);
      if (filters.paymentType) params.set("paymentType", filters.paymentType);
      params.set("month", String(filters.month));
      params.set("year", String(filters.year));
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setTransactions(json.data);
      }
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
    const params = new URLSearchParams();
    if (filters.type !== "ALL") params.set("type", filters.type);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.search) params.set("search", filters.search);
    if (filters.cardId) params.set("cardId", filters.cardId);
    if (filters.paid) params.set("paid", filters.paid);
    if (filters.isFixed) params.set("isFixed", filters.isFixed);
    if (filters.paymentType) params.set("paymentType", filters.paymentType);
    params.set("month", String(filters.month));
    params.set("year", String(filters.year));
    params.set("format", format);

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

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <TransactionFilters onFilterChange={handleFilterChange} />
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <TransactionList
          transactions={transactions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={fetchTransactions}
          onTogglePaid={fetchTransactions}
          viewMode={viewMode}
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
        onSuccess={fetchTransactions}
      />

      <BulkDuplicateDialog
        open={bulkDuplicateOpen}
        onOpenChange={setBulkDuplicateOpen}
        onSuccess={fetchTransactions}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
