"use client";

import { useState, useEffect } from "react";
import { Search, X, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
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
  month: number;
  year: number;
}

export function TransactionFilters({
  onFilterChange,
}: TransactionFiltersProps) {
  const now = new Date();
  const [type, setType] = useState<TransactionType | "ALL">("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
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
      month,
      year,
    });
  }, [type, categoryId, debouncedSearch, month, year, onFilterChange]);

  const MONTH_NAMES = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  function goToPreviousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function handleClearFilters() {
    setType("ALL");
    setCategoryId("ALL");
    setSearch("");
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  }

  const hasActiveFilters =
    type !== "ALL" || categoryId !== "ALL" || search !== "" || month !== now.getMonth() || year !== now.getFullYear();

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 min-w-[140px] justify-center">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {MONTH_NAMES[month]} {year}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Other filters */}
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
    </div>
  );
}
