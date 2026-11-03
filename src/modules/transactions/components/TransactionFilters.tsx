"use client";

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Badge } from "@/common/components/ui/badge";
import { useCards } from "@/modules/cards/hooks/useCards";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import { useDebounce } from "@/common/hooks/useDebounce";
import type { TransactionType, PaymentType } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS } from "@/types";

interface TransactionFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  type: TransactionType | "ALL";
  categoryId: string;
  search: string;
  cardId: string;
  paid: string;
  isFixed: string;
  paymentType: string;
}

export function TransactionFilters({
  onFilterChange,
}: TransactionFiltersProps) {
  const [type, setType] = useState<TransactionType | "ALL">("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cardId, setCardId] = useState("ALL");
  const [paid, setPaid] = useState("ALL");
  const [isFixed, setIsFixed] = useState("ALL");
  const [paymentType, setPaymentType] = useState("ALL");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data: categories = [] } = useCategories(type === "ALL" ? undefined : type);
  const { data: cards = [] } = useCards();

  useEffect(() => {
    onFilterChange({
      type,
      categoryId: categoryId === "ALL" ? "" : categoryId,
      search: debouncedSearch,
      cardId: cardId === "ALL" ? "" : cardId,
      paid: paid === "ALL" ? "" : paid,
      isFixed: isFixed === "ALL" ? "" : isFixed,
      paymentType: paymentType === "ALL" ? "" : paymentType,
    });
  }, [type, categoryId, debouncedSearch, cardId, paid, isFixed, paymentType, onFilterChange]);

  function handleClearFilters() {
    setType("ALL");
    setCategoryId("ALL");
    setSearch("");
    setCardId("ALL");
    setPaid("ALL");
    setIsFixed("ALL");
    setPaymentType("ALL");
  }

  const hasActiveFilters =
    type !== "ALL" || categoryId !== "ALL" || search !== "" ||
    cardId !== "ALL" || paid !== "ALL" || isFixed !== "ALL" || paymentType !== "ALL";

  const advancedFilterCount = [cardId !== "ALL", paid !== "ALL", isFixed !== "ALL", paymentType !== "ALL"].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Basic filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
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

      <Button
        variant={showAdvanced ? "secondary" : "outline"}
        size="icon"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="shrink-0 relative"
        title="Filtros avançados"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {advancedFilterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {advancedFilterCount}
          </span>
        )}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearFilters}
          className="shrink-0"
          title="Limpar filtros"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-3 border-t animate-in fade-in slide-in-from-top-2 duration-200">
          <Select value={paid} onValueChange={setPaid}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos Status</SelectItem>
              <SelectItem value="true">✅ Pago</SelectItem>
              <SelectItem value="false">⏳ Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isFixed} onValueChange={setIsFixed}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Tipo Despesa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Fixa/Variável</SelectItem>
              <SelectItem value="true">📌 Fixa</SelectItem>
              <SelectItem value="false">🔄 Variável</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos Pagamentos</SelectItem>
              {(["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"] as PaymentType[]).map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {PAYMENT_TYPE_ICONS[pt]} {PAYMENT_TYPE_LABELS[pt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {cards.length > 0 && (
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Cartão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos Cartões</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    <span className="flex items-center gap-2">
                      {card.icon ? <span>{card.icon}</span> : <span>💳</span>}
                      {card.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Active advanced filter badges */}
      {advancedFilterCount > 0 && !showAdvanced && (
        <div className="flex flex-wrap gap-2">
          {paid !== "ALL" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setPaid("ALL")}>
              {paid === "true" ? "✅ Pago" : "⏳ Pendente"}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {isFixed !== "ALL" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setIsFixed("ALL")}>
              {isFixed === "true" ? "📌 Fixa" : "🔄 Variável"}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {paymentType !== "ALL" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setPaymentType("ALL")}>
              {PAYMENT_TYPE_ICONS[paymentType as PaymentType]} {PAYMENT_TYPE_LABELS[paymentType as PaymentType]}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {cardId !== "ALL" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setCardId("ALL")}>
              💳 {cards.find(c => c.id === cardId)?.name || "Cartão"}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
