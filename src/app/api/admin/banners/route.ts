import { prisma } from "@/lib/db";
import { adminGuard, ok, parseBody } from "@/lib/api";
import { bannerSchema } from "@/lib/banners";

export const dynamic = "force-dynamic";

const clean = (d: ReturnType<typeof bannerSchema.parse>) => ({
  ...d,
  eyebrow: d.eyebrow || null,
  subtitle: d.subtitle || null,
  ctaText: d.ctaText || null,
  ctaHref: d.ctaHref || null,
  cta2Text: d.cta2Text || null,
  cta2Href: d.cta2Href || null,
  imageMobile: d.imageMobile || null,
});

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = await parseBody(req, bannerSchema);
  if ("error" in parsed) return parsed.error;
  const banner = await prisma.banner.create({ data: clean(parsed.data) });
  return ok({ id: banner.id }, 201);
}
