"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { TransactionList } from "@/modules/transactions/components/TransactionList";
import { TransactionForm } from "@/modules/transactions/components/TransactionForm";
import {
  TransactionFilters,
  type FilterValues,
} from "@/modules/transactions/components/TransactionFilters";
import type { Transaction } from "@/types";

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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== "ALL") params.set("type", filters.type);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (json.data) {
        setTransactions(json.data);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  function handleNewTransaction() {
    setEditingTransaction(null);
    setFormOpen(true);
  }

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button onClick={handleNewTransaction}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <TransactionFilters onFilterChange={handleFilterChange} />

      <TransactionList
        transactions={transactions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={fetchTransactions}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editingTransaction}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
