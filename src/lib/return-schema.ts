import { z } from "zod";

export const returnBody = z.object({
  orderId: z.string().min(1),
  reason: z.enum(["DAMAGED", "DEFECTIVE", "WRONG_ITEM", "NOT_AS_DESCRIBED", "OTHER"]),
  details: z.string().trim().min(10, "Please describe what's wrong (at least a few words)").max(1000),
  photos: z.array(z.string().url()).max(5).default([]),
  items: z.array(z.object({ orderItemId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1, "Choose at least one item").max(20),
});
