import { z } from "zod";

export const createChallanSchema = z.object({
  customerId: z.string().min(1),
  status: z.enum(["DRAFT", "CONFIRMED"]).default("DRAFT"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one product line is required"),
});

// Only status transitions are allowed after creation (Draft -> Confirmed / Cancelled).
export const updateChallanStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});
