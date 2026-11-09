import { z } from "zod";
import { adminGuard, ok, parseBody } from "@/lib/api";
import { saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const schema = z.object({
  announcement: z.string().trim().max(200),
  freeShippingThreshold: z.number().int().min(0),
  shippingFee: z.number().int().min(0),
  codEnabled: z.boolean(),
  codFee: z.number().int().min(0),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  instagram: z.string().trim().max(200),
  address: z.string().trim().max(240),
  ownerEmail: z.string().trim().email().or(z.literal("")),
});

export async function PUT(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = await parseBody(req, schema);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  await saveSettings({
    announcement: d.announcement,
    freeShippingThreshold: String(d.freeShippingThreshold),
    shippingFee: String(d.shippingFee),
    codEnabled: String(d.codEnabled),
    codFee: String(d.codFee),
    contactEmail: d.contactEmail,
    contactPhone: d.contactPhone,
    whatsapp: d.whatsapp,
    instagram: d.instagram,
    address: d.address,
    ownerEmail: d.ownerEmail,
  });
  return ok();
}
