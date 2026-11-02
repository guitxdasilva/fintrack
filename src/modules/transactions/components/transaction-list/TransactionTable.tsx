import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { cn, formatCurrency, formatDate, getTransactionColor, truncateText } from "@/lib/utils";
import type { PaymentType, Transaction } from "@/types";
import { PAYMENT_TYPE_ICONS, PAYMENT_TYPE_LABELS } from "@/types";
import { FixedBadge } from "./FixedBadge";
import { SortableHead, type SortState } from "./SortableHead";

interface TransactionTableProps extends SortState {
  transactions: Transaction[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

/** Desktop table view. */
export function TransactionTable({
  transactions,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  ...sort
}: TransactionTableProps) {
  const allSelected = selected.size === transactions.length;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <button
              className="h-7 w-7 flex items-center justify-center rounded-md transition-colors hover:bg-muted"
              onClick={onToggleAll}
              title={allSelected ? "Desmarcar todas" : "Selecionar todas"}
            >
              {allSelected ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : selected.size > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-primary/50" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </TableHead>
          <SortableHead field="description" {...sort}>Descrição</SortableHead>
          <SortableHead field="category" {...sort}>Categoria</SortableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Parcela</TableHead>
          <SortableHead field="date" {...sort}>Data</SortableHead>
          <SortableHead field="amount" className="text-right" align="right" {...sort}>
            Valor
          </SortableHead>
          <TableHead className="text-right w-25">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          const isSelected = selected.has(t.id);
          return (
            <TableRow key={t.id} className={cn(t.paid && "opacity-60", isSelected && "bg-primary/5")}>
              <TableCell>
                <button
                  className="h-7 w-7 flex items-center justify-center rounded-md transition-colors hover:bg-muted"
                  onClick={() => onToggle(t.id)}
                  title={isSelected ? "Desmarcar" : "Selecionar"}
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : t.type === "EXPENSE" && t.paid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TableCell>
              <TableCell className="font-medium max-w-48 lg:max-w-72">
                <span
                  className={cn(
                    "flex items-center gap-1.5 truncate",
                    t.paid && "line-through decoration-muted-foreground/50"
                  )}
                  title={t.description}
                >
                  <span className="truncate">{truncateText(t.description)}</span>
                  {t.isFixed && <FixedBadge />}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  {t.category?.icon && <span>{t.category.icon}</span>}
                  {t.category?.name}
                </Badge>
              </TableCell>
              <TableCell>
                {t.paymentType ? (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="gap-1.5 font-normal">
                      <span>{PAYMENT_TYPE_ICONS[t.paymentType as PaymentType]}</span>
                      {PAYMENT_TYPE_LABELS[t.paymentType as PaymentType]}
                    </Badge>
                    {t.paymentType === "CARD" && t.card && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {t.card.icon} {t.card.name}
                      </Badge>
                    )}
                    {t.cardType && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        {t.cardType === "CREDIT" ? "Crédito" : "Débito"}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {t.installments ? (
                  <Badge variant="outline" className="font-normal text-xs">
                    {t.currentInstallment}/{t.installments}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <span>{formatDate(t.date)}</span>
                  {t.purchaseDate && (
                    <p className="text-xs text-muted-foreground" title="Data da compra">
                      Compra: {formatDate(t.purchaseDate)}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className={cn("text-right font-semibold", getTransactionColor(t.type))}>
                {t.type === "EXPENSE" ? "- " : "+ "}
                {formatCurrency(t.amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => onDelete(t)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
