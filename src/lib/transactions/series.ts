/**
 * Installment purchases and fixed (recurring) expenses share an
 * `installmentGroupId`; `currentInstallment` orders them (1-based).
 */

export const SERIES_SCOPES = ["this", "future", "all"] as const;
export type SeriesScope = (typeof SERIES_SCOPES)[number];

export const SERIES_SCOPE_LABELS: Record<SeriesScope, string> = {
  this: "Só esta",
  future: "Esta e as próximas",
  all: "Todas",
};

interface SeriesMember {
  id: string;
  userId: string;
  installmentGroupId: string | null;
  currentInstallment: number | null;
}

/** Prisma `where` selecting the transactions affected by `scope`. */
export function seriesWhere(existing: SeriesMember, scope: SeriesScope) {
  if (scope === "this" || !existing.installmentGroupId) {
    return { id: existing.id, userId: existing.userId };
  }

  const where = {
    userId: existing.userId,
    installmentGroupId: existing.installmentGroupId,
  };

  if (scope === "future") {
    return { ...where, currentInstallment: { gte: existing.currentInstallment ?? 1 } };
  }

  return where;
}

const SUFFIX_RE = /\s\((\d+)\/(\d+)\)$/;

/** "Notebook (2/10)" → "Notebook". */
export function stripInstallmentSuffix(description: string): string {
  return description.replace(SUFFIX_RE, "");
}

/** True when the description carries this transaction's own "(n/total)" suffix. */
export function hasInstallmentSuffix(
  description: string,
  current: number | null,
  total: number | null
): boolean {
  const match = description.match(SUFFIX_RE);
  return !!match && Number(match[1]) === current && Number(match[2]) === total;
}

export function withInstallmentSuffix(base: string, current: number, total: number): string {
  return `${base} (${current}/${total})`;
}
