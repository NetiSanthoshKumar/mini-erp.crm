import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  category: z.string().optional(),
  unitPrice: z.number().nonnegative(),
  currentStock: z.number().int().nonnegative().default(0),
  minStockAlertQty: z.number().int().nonnegative().default(0),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  quantity: z.number().int().positive(),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1),
});
