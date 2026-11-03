import { z } from "zod";

export const recurrenceTargetSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  key: z.string().min(1).max(200),
});
