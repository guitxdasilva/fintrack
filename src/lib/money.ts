/** Rounds to cents, removing float noise (0.1 + 0.2 → 0.3). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sums money values in integer cents to avoid float drift. */
export function sumMoney<T>(items: T[], pick: (item: T) => number): number {
  const cents = items.reduce((acc, item) => acc + Math.round(pick(item) * 100), 0);
  return cents / 100;
}
