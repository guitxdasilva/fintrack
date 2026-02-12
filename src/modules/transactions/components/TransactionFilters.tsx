"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { useDebounce } from "@/common/hooks/useDebounce";
import type { Category, TransactionType } from "@/types";

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  type: TransactionType | "ALL";
  categoryId: string;
  search: string;
}

export function TransactionFilters({
  onFilterChange,
}: TransactionFiltersProps) {
  const [type, setType] = useState<TransactionType | "ALL">("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const url =
          type === "ALL" ? "/api/categories" : `/api/categories?type=${type}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.data) {
          setCategories(json.data);
        }
      } catch {
        setCategories([]);
      }
    }

    fetchCategories();
  }, [type]);

  useEffect(() => {
    onFilterChange({
      type,
      categoryId: categoryId === "ALL" ? "" : categoryId,
      search: debouncedSearch,
    });
  }, [type, categoryId, debouncedSearch, onFilterChange]);

  function handleClearFilters() {
    setType("ALL");
    setCategoryId("ALL");
    setSearch("");
  }

  const hasActiveFilters =
    type !== "ALL" || categoryId !== "ALL" || search !== "";

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={type}
        onValueChange={(val) => {
          setType(val as TransactionType | "ALL");
          setCategoryId("ALL");
        }}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="INCOME">Receitas</SelectItem>
          <SelectItem value="EXPENSE">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-2">
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
