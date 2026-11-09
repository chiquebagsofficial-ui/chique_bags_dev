import { prisma } from "@/lib/db";
import { adminGuard, ok, parseBody } from "@/lib/api";
import { bannerSchema } from "@/lib/banners";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const parsed = await parseBody(req, bannerSchema);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;
  await prisma.banner.update({
    where: { id },
    data: {
      ...d,
      eyebrow: d.eyebrow || null,
      subtitle: d.subtitle || null,
      ctaText: d.ctaText || null,
      ctaHref: d.ctaHref || null,
      cta2Text: d.cta2Text || null,
      cta2Href: d.cta2Href || null,
      imageMobile: d.imageMobile || null,
    },
  });
  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  await prisma.banner.delete({ where: { id } }).catch(() => null);
  return ok();
}
