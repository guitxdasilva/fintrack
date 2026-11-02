import { useCallback, useState } from "react";

/** Set of selected ids with toggle/replace/clear helpers. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const replace = useCallback((ids: Iterable<string>) => setSelected(new Set(ids)), []);
  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, replace, clear };
}
