"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { TransactionList } from "@/modules/transactions/components/TransactionList";
import { TransactionForm } from "@/modules/transactions/components/TransactionForm";
import {
  TransactionFilters,
  type FilterValues,
} from "@/modules/transactions/components/TransactionFilters";
import { Pagination } from "@/common/components/ui/pagination";
import type { Transaction } from "@/types";

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
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    type: "ALL",
    categoryId: "",
    search: "",
  });
  const [page, setPage] = useState(1);
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
      params.set("page", String(page));
      params.set("limit", "10");

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
  }, [filters, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  function handleNewTransaction() {
    setEditingTransaction(null);
    setFormOpen(true);
  }

  function handleExportCSV() {
    const params = new URLSearchParams();
    if (filters.type !== "ALL") params.set("type", filters.type);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.search) params.set("search", filters.search);

    window.open(`/api/transactions/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={handleNewTransaction} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
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
        />
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPageChange={setPage}
        />
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editingTransaction}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
