"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Upload,
  FileUp,
  AlertCircle,
  Check,
  Loader2,
  Trash2,
  CheckCircle2,
  Circle,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/common/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Category, Card as CardType } from "@/types";
import { BANK_OPTIONS } from "@/lib/import/types";
import { matchCategories } from "@/lib/import/category-matcher";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "importing";

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [bank, setBank] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set());
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [txCategories, setTxCategories] = useState<Map<number, string>>(new Map());
  const [defaultCategoryId, setDefaultCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [cardType, setCardType] = useState<"CREDIT" | "DEBIT" | "">("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStep("upload");
      setBank("");
      setFile(null);
      setTransactions([]);
      setSelectedIdxs(new Set());
      setParseErrors([]);
      setTxCategories(new Map());
      setDefaultCategoryId("");
      setCardId("");
      setCardType("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      try {
        const [catRes, cardRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/cards"),
        ]);
        const catJson = await catRes.json();
        const cardJson = await cardRes.json();
        if (catJson.data) setCategories(catJson.data);
        if (cardJson.data) setCards(cardJson.data);
      } catch {
      }
    }
    fetchData();
  }, [open]);

  function toggleSelection(idx: number) {
    setSelectedIdxs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAll() {
    setSelectedIdxs(new Set(transactions.map((_, i) => i)));
  }

  function deselectAll() {
    setSelectedIdxs(new Set());
  }

  async function handleParse() {
    if (!file || !bank) {
      toast.error("Selecione o banco e o arquivo");
      return;
    }

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bank", bank);
      formData.append("action", "preview");

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao processar arquivo");
        return;
      }

      const data = json.data;
      setTransactions(data.transactions || []);
      setParseErrors(data.errors || []);
      setSelectedIdxs(new Set((data.transactions || []).map((_: ParsedTransaction, i: number) => i)));

      if (data.transactions?.length > 0 && categories.length > 0) {
        const autoMap = matchCategories(data.transactions, categories);
        setTxCategories(autoMap);
      }

      setStep("preview");

      if (data.transactions?.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo");
      } else {
        toast.success(`${data.transactions.length} transação(ões) encontrada(s)`);
      }
    } catch {
      toast.error("Erro ao processar arquivo");
    } finally {
      setParsing(false);
    }
  }

  const uncategorizedSelected = useMemo(() => {
    return Array.from(selectedIdxs).some(
      (i) => !txCategories.has(i) && !defaultCategoryId
    );
  }, [selectedIdxs, txCategories, defaultCategoryId]);

  function setTxCategory(idx: number, catId: string) {
    setTxCategories((prev) => {
      const next = new Map(prev);
      if (catId) {
        next.set(idx, catId);
      } else {
        next.delete(idx);
      }
      return next;
    });
  }

  function applyDefaultToAll() {
    if (!defaultCategoryId) return;
    setTxCategories((prev) => {
      const next = new Map(prev);
      for (const idx of selectedIdxs) {
        if (!next.has(idx)) {
          next.set(idx, defaultCategoryId);
        }
      }
      return next;
    });
  }

  async function handleImport() {
    if (selectedIdxs.size === 0) {
      toast.error("Selecione pelo menos uma transação");
      return;
    }

    const missingCategory = Array.from(selectedIdxs).some(
      (i) => !txCategories.has(i) && !defaultCategoryId
    );
    if (missingCategory) {
      toast.error("Todas as transações precisam de uma categoria");
      return;
    }

    setStep("importing");

    try {
      const selectedTransactions = Array.from(selectedIdxs).map((i) => ({
        ...transactions[i],
        categoryId: txCategories.get(i) || defaultCategoryId,
      }));

      const formData = new FormData();
      formData.append("bank", bank);
      formData.append("action", "confirm");
      formData.append("transactions", JSON.stringify(selectedTransactions));
      if (cardId && cardId !== "none") formData.append("cardId", cardId);
      if (cardType) formData.append("cardType", cardType);

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao importar");
        setStep("preview");
        return;
      }

      toast.success(json.data?.message || "Transações importadas!");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao importar transações");
      setStep("preview");
    }
  }

  const selectedTotal = Array.from(selectedIdxs).reduce(
    (sum, i) => sum + (transactions[i]?.amount || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Extrato
          </DialogTitle>
          <DialogDescription>
            Importe transações de um arquivo CSV ou PDF do seu banco
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Bank selection */}
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={bank} onValueChange={setBank}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent portal={false} position="popper" className="max-h-60">
                  {BANK_OPTIONS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File input */}
            <div className="space-y-2">
              <Label>Arquivo (CSV ou PDF)</Label>
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-10 w-10 text-muted-foreground" />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceitos: .csv, .pdf
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.pdf,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!file || !bank || parsing}
                onClick={handleParse}
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Processar arquivo
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  {parseErrors.length} aviso(s):
                </div>
                <div className="max-h-20 overflow-y-auto">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{err}</p>
                  ))}
                  {parseErrors.length > 5 && (
                    <p className="text-xs text-muted-foreground">...e mais {parseErrors.length - 5}</p>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{selectedIdxs.size}</span> de{" "}
                <span className="font-medium">{transactions.length}</span> selecionada(s)
                {selectedIdxs.size > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    Total: <span className="font-medium text-red-500">{formatCurrency(selectedTotal)}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Todas
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Nenhuma
                </Button>
              </div>
            </div>

            {/* Transaction list */}
            <div className="max-h-72 overflow-y-auto space-y-1 rounded-lg border p-2">
              {transactions.map((t, i) => {
                const isSelected = selectedIdxs.has(i);
                const catId = txCategories.get(i) || "";
                const cat = catId ? categories.find((c) => c.id === catId) : null;
                return (
                  <div
                    key={i}
                    className={`rounded-lg p-2 transition-colors ${
                      isSelected ? "bg-primary/5 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelection(i)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted/50"
                      >
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium truncate" title={t.description}>{t.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {cat && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Tag className="h-3 w-3" />
                              {cat.icon} {cat.name}
                            </span>
                          )}
                          {!cat && isSelected && (
                            <span className="text-xs text-amber-500">Sem categoria</span>
                          )}
                        </div>
                      </div>

                      <p className={`text-sm font-semibold whitespace-nowrap shrink-0 ${
                        t.type === "INCOME" ? "text-emerald-500" : "text-red-500"
                      }`}>
                        {t.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 ml-10">
                      <Select
                        value={catId || "__none__"}
                        onValueChange={(v) => setTxCategory(i, v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent portal={false} position="popper" className="max-h-52">
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">Nenhuma</span>
                          </SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="flex items-center gap-1">
                                {c.icon && <span>{c.icon}</span>}
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge variant={t.type === "INCOME" ? "default" : "destructive"} className="text-xs shrink-0">
                        {t.type === "INCOME" ? "Receita" : "Despesa"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Category and Card selection */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Categoria padrão (para transações sem categoria)</Label>
                <div className="flex gap-2">
                  <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione a categoria padrão" />
                    </SelectTrigger>
                    <SelectContent portal={false} position="popper" className="max-h-60">
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
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!defaultCategoryId}
                    onClick={applyDefaultToAll}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cartão (opcional)</Label>
                <Select value={cardId} onValueChange={(v) => setCardId(v === "none" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem cartão" />
                  </SelectTrigger>
                  <SelectContent portal={false} position="popper" className="max-h-60">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          {c.icon && <span>{c.icon}</span>}
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cardId && (
                <div className="space-y-2">
                  <Label>Tipo do Cartão</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={cardType === "CREDIT" ? "default" : "outline"}
                      onClick={() => setCardType("CREDIT")}
                    >
                      Crédito
                    </Button>
                    <Button
                      type="button"
                      variant={cardType === "DEBIT" ? "default" : "outline"}
                      onClick={() => setCardType("DEBIT")}
                    >
                      Débito
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("upload")}
              >
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={selectedIdxs.size === 0 || uncategorizedSelected}
                onClick={handleImport}
              >
                <Check className="h-4 w-4 mr-2" />
                Importar {selectedIdxs.size} transação(ões)
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Importing ── */}
        {step === "importing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Importando {selectedIdxs.size} transação(ões)...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
