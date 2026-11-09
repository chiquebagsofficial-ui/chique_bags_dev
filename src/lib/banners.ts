import { z } from "zod";

const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Links must start with / or https://");

export const bannerSchema = z.object({
  eyebrow: z.string().trim().max(60).nullish(),
  title: z.string().trim().min(2, "Enter a headline").max(120),
  subtitle: z.string().trim().max(240).nullish(),
  ctaText: z.string().trim().max(30).nullish(),
  ctaHref: href.nullish(),
  cta2Text: z.string().trim().max(30).nullish(),
  cta2Href: href.nullish(),
  image: z.string().trim().url("Add a banner image"),
  imageMobile: z.string().trim().url().nullish().or(z.literal("")),
  focus: z.string().trim().max(30).default("center"),
  theme: z.enum(["light", "dark"]).default("light"),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
});
export type BannerInput = z.infer<typeof bannerSchema>;

/** Splits "Carry elegance in *every stride*" into plain and italic parts. */
export function splitEmphasis(title: string): { text: string; em: boolean }[] {
  return title
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("*") && part.endsWith("*") ? { text: part.slice(1, -1), em: true } : { text: part, em: false }));
}
