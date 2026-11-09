import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{8,16}$/, "Enter a valid phone number");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  password: passwordSchema,
});

export const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter the recipient name").max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(3, "Enter the street address").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city").max(60),
  state: z.string().trim().min(2, "Enter the state").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const cartSchema = z
  .array(
    z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().min(1).max(10),
    })
  )
  .min(1, "Your bag is empty")
  .max(30);

export const productSchema = z.object({
  name: z.string().trim().min(2).max(140),
  categoryId: z.string().min(1, "Choose a category"),
  price: z.number().int().min(1),
  originalPrice: z.number().int().min(0).nullish(),
  shortDescription: z.string().trim().max(240).nullish(),
  description: z.string().trim().max(5000).nullish(),
  images: z.array(z.string().url()).max(10),
  features: z.array(z.string().trim().min(1).max(160)).max(12),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(15),
  material: z.string().trim().max(120).nullish(),
  dimensions: z.string().trim().max(120).nullish(),
  careInstructions: z.string().trim().max(600).nullish(),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1).max(40),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        stock: z.number().int().min(0).max(100000),
      })
    )
    .min(1, "Add at least one colour"),
});
export type ProductInput = z.infer<typeof productSchema>;

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(30).regex(/^[A-Z0-9_-]+$/, "Letters, numbers, - and _ only"),
  description: z.string().trim().max(160).nullish(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.number().int().min(1),
  maxDiscount: z.number().int().min(0).nullish(),
  minOrder: z.number().int().min(0).default(0),
  usageLimit: z.number().int().min(1).nullish(),
  oncePerUser: z.boolean().default(true),
  isActive: z.boolean().default(true),
  expiresAt: z.string().nullish(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).nullish(),
  image: z.string().url().nullish().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
});

export function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Invalid input";
}
