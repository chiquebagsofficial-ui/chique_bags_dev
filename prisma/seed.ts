import { config } from "dotenv";
config({ override: true });
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Photo URLs come from scripts/stock-photos.mjs (real stock photographs uploaded to Cloudinary).
const images: { site: Record<string, string>; products: Record<string, string[]> } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "seed-images.json"), "utf8")
);

const categories = [
  { name: "Crescent & Mini", slug: "crescent-slings", description: "Small, sculpted shapes for the essentials.", image: images.products["the-petite-crescent-sling"]?.[0] ?? null, sortOrder: 10 },
  { name: "Quilted & Chain", slug: "quilted-chain", description: "Quilted textures and gold-tone chain straps.", image: images.products["rose-quilted-top-handle-bag"]?.[0] ?? null, sortOrder: 20 },
  { name: "Crossbody & Everyday", slug: "crossbody-bags", description: "Easy bags for every day of the week.", image: images.site["category-crossbody"] ?? null, sortOrder: 30 },
];

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  price: number;
  mrp: number;
  short: string;
  tags: string[];
  flags: { isNew?: boolean; isBestSeller?: boolean; isFeatured?: boolean };
  dimensions: string;
  colours: [string, string, number][];
};

const products: SeedProduct[] = [
  { name: "The Petite Crescent Sling", slug: "the-petite-crescent-sling", category: "crescent-slings", price: 1299, mrp: 2199, short: "A half-moon sling in soft vegan leather with a gold-finish zip and a flat shoulder strap.", tags: ["crescent", "tan", "bestseller"], flags: { isBestSeller: true, isFeatured: true }, dimensions: "26 cm wide × 13 cm high × 5 cm deep", colours: [["Caramel Tan", "#b87f4f", 12], ["Onyx Black", "#1c1c1c", 10], ["Ivory", "#efe6d6", 8]] },
  { name: "Aura Quilted Chain Clutch", slug: "aura-quilted-chain-clutch", category: "quilted-chain", price: 1499, mrp: 2499, short: "A diamond-quilted clutch with a fine gold-tone chain you can wear on the shoulder or tuck away.", tags: ["chain", "quilted", "white", "bestseller"], flags: { isBestSeller: true, isFeatured: true }, dimensions: "23 cm wide × 13 cm high × 5 cm deep", colours: [["Ivory White", "#f4f1ec", 8], ["Matte Black", "#181818", 10]] },
  { name: "Coral Chain Sling", slug: "coral-chain-sling", category: "quilted-chain", price: 1599, mrp: 2599, short: "A bold coral flap bag with a heavy gold-tone chain strap. Impossible to miss.", tags: ["chain", "coral", "party"], flags: { isNew: true, isFeatured: true }, dimensions: "24 cm wide × 15 cm high × 7 cm deep", colours: [["Coral", "#e8552f", 7], ["Black", "#181818", 9]] },
  { name: "Rosé Quilted Top-Handle Bag", slug: "rose-quilted-top-handle-bag", category: "quilted-chain", price: 1799, mrp: 2899, short: "A structured top-handle bag in quilted rosé with a teardrop clasp and a detachable strap.", tags: ["quilted", "pink", "handle", "bestseller"], flags: { isBestSeller: true }, dimensions: "22 cm wide × 17 cm high × 9 cm deep", colours: [["Rosé", "#d99a93", 6], ["Black", "#181818", 6]] },
  { name: "Blush Turn-Lock Satchel", slug: "blush-turn-lock-satchel", category: "crossbody-bags", price: 1699, mrp: 2799, short: "A soft blush satchel with a polished turn-lock and a top handle, roomy enough for daily essentials.", tags: ["satchel", "pink", "turn-lock"], flags: { isNew: true }, dimensions: "24 cm wide × 18 cm high × 9 cm deep", colours: [["Blush", "#e8b4b5", 6], ["Tan", "#b87f4f", 6]] },
  { name: "Petal Pink Mini Flap Bag", slug: "petal-pink-mini-flap-bag", category: "crescent-slings", price: 1099, mrp: 1799, short: "A small structured flap bag in petal pink with a gold-tone clasp. Phone, cards and a lipstick.", tags: ["mini", "pink", "flap"], flags: { isNew: true }, dimensions: "19 cm wide × 12 cm high × 6 cm deep", colours: [["Petal Pink", "#f0a9bf", 9], ["Ivory", "#efe6d6", 6]] },
  { name: "Midnight Bucket Chain Bag", slug: "midnight-bucket-chain-bag", category: "quilted-chain", price: 1399, mrp: 2299, short: "A black drawstring bucket bag with a gold-tone chain closure. Casual by day, dressy by night.", tags: ["bucket", "black", "chain", "bestseller"], flags: { isBestSeller: true }, dimensions: "20 cm wide × 22 cm high × 12 cm deep", colours: [["Black", "#181818", 10]] },
  { name: "Saddle Tan Crossbody", slug: "saddle-tan-crossbody", category: "crossbody-bags", price: 1199, mrp: 1999, short: "A classic saddle-shaped crossbody in warm tan with an adjustable strap.", tags: ["crossbody", "tan", "bestseller"], flags: { isBestSeller: true }, dimensions: "21 cm wide × 17 cm high × 7 cm deep", colours: [["Saddle Tan", "#b4693a", 10], ["Black", "#181818", 8]] },
  { name: "Metro Daily Camera Pouch", slug: "metro-daily-camera-pouch", category: "crossbody-bags", price: 799, mrp: 1399, short: "A no-fuss black crossbody with a zip top, a front pocket and a strap that adjusts to your height.", tags: ["under999", "crossbody", "daily", "black"], flags: { isNew: true }, dimensions: "22 cm wide × 15 cm high × 7 cm deep", colours: [["Black", "#1c1c1c", 15], ["Mocha", "#8a6f5c", 10]] },
  { name: "Cognac Woven Chain Tote", slug: "cognac-woven-chain-tote", category: "crossbody-bags", price: 1899, mrp: 2999, short: "A woven-leather tote in cognac with a gold-tone chain detail. Room for a laptop and a lunch.", tags: ["tote", "woven", "brown", "chain"], flags: { isNew: true }, dimensions: "34 cm wide × 26 cm high × 11 cm deep", colours: [["Cognac", "#a3562c", 5]] },
  { name: "Slate Buckle Satchel", slug: "slate-buckle-satchel", category: "crossbody-bags", price: 1699, mrp: 2699, short: "A structured satchel in slate grey with twin buckles, a top handle and a long crossbody strap.", tags: ["satchel", "grey", "buckle"], flags: {}, dimensions: "26 cm wide × 19 cm high × 10 cm deep", colours: [["Slate Grey", "#8a8a90", 6]] },
  { name: "Cocoa Leather Messenger", slug: "cocoa-leather-messenger", category: "crossbody-bags", price: 949, mrp: 1699, short: "A relaxed messenger-style crossbody in cocoa brown with a flap closure and a roomy main compartment.", tags: ["under999", "messenger", "brown", "crossbody"], flags: {}, dimensions: "25 cm wide × 18 cm high × 7 cm deep", colours: [["Cocoa", "#6b4226", 10], ["Black", "#181818", 8]] },
];

// Sample products from earlier seeds (illustrations) that no longer exist. Past orders keep their own copy.
const LEGACY_SLUGS = [
  "aura-quilted-gold-chain-sling", "cloud-puffer-crossbody-sling", "petite-structured-mini-sling", "parisian-vegan-leather-sling",
  "metro-daily-crossbody-pouch", "velvet-shimmer-evening-sling", "caramel-latte-explorer-sling", "ivory-pearl-crescent-mini",
  "midnight-quilted-mini-chain-bag", "blush-puffer-mini-pouch", "olive-everyday-crossbody",
];

async function main() {
  // Owner / admin account
  const adminEmail = (process.env.ADMIN_EMAIL || "owner@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe#2026";
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || "Store Owner",
      password: await bcrypt.hash(adminPassword, 11),
      role: "ADMIN",
      emailVerified: true,
    },
    update: { role: "ADMIN", password: await bcrypt.hash(adminPassword, 11) },
  });

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder },
    });
  }
  const cats = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  const removed = await prisma.product.deleteMany({ where: { slug: { in: LEGACY_SLUGS } } });
  if (removed.count) console.log(`Removed ${removed.count} old sample products`);

  for (const p of products) {
    const photos = images.products[p.slug] ?? [];
    const shared = {
      name: p.name,
      categoryId: cats.get(p.category)!,
      price: p.price,
      originalPrice: p.mrp,
      shortDescription: p.short,
      description: `${p.short}\n\nHandcrafted with care in India. Gold-tone hardware, a soft lining and a strap you can adjust to sit exactly where you like.`,
      images: photos,
      features: ["Handcrafted in small batches", "Gold-tone hardware", "Adjustable strap", "Soft cotton lining", "Dust bag included"],
      tags: p.tags,
      material: "Premium vegan leather",
      dimensions: p.dimensions,
      careInstructions: "Wipe with a soft, dry cloth. Keep away from water, heat and sharp objects. Store in the dust bag provided.",
      isNew: Boolean(p.flags.isNew),
      isBestSeller: Boolean(p.flags.isBestSeller),
      isFeatured: Boolean(p.flags.isFeatured),
      isActive: true,
    };
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // Refresh copy and photos; leave colours and stock alone so live stock is never reset.
      await prisma.product.update({ where: { slug: p.slug }, data: shared });
    } else {
      await prisma.product.create({
        data: { ...shared, slug: p.slug, variants: { create: p.colours.map(([name, hex, stock], i) => ({ name, hex, stock, sortOrder: i })) } },
      });
    }
  }

  const coupons = [
    { code: "CHIQUE15", description: "Flat 15% off your first order", type: "PERCENTAGE" as const, value: 15, maxDiscount: 500, minOrder: 0, oncePerUser: true },
    { code: "CHIQUE150", description: "₹150 off orders above ₹999", type: "FLAT" as const, value: 150, minOrder: 999, oncePerUser: true },
  ];
  for (const c of coupons) await prisma.coupon.upsert({ where: { code: c.code }, create: c, update: {} });

  // Homepage banners: only created when there are none, so edits made in Admin > Banners are never overwritten.
  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.createMany({
      data: [
        {
          eyebrow: "New season collection",
          title: "Carry elegance in *every stride*",
          subtitle: "Handcrafted sling and crossbody bags with soft, structured shapes and gold-tone hardware.",
          ctaText: "Shop the collection", ctaHref: "/shop", cta2Text: "Under ₹999", cta2Href: "/shop?max=999",
          image: images.site["banner-new-season"], focus: "center 35%", theme: "light", sortOrder: 1,
        },
        {
          eyebrow: "Gifting",
          title: "Wrapped with *love*",
          subtitle: "Add a gift box and a handwritten note to any bag. One tap at checkout.",
          ctaText: "Explore gifting", ctaHref: "/gifting",
          image: images.site["banner-gifting"], focus: "center", theme: "dark", sortOrder: 2,
        },
        {
          eyebrow: "Bestsellers",
          title: "The bags everyone *keeps asking for*",
          subtitle: "Quilted, chain-strapped and crossbody. Our most loved styles, back in stock.",
          ctaText: "Shop bestsellers", ctaHref: "/shop?sort=popular",
          image: images.site["banner-collection"], focus: "center 45%", theme: "light", sortOrder: 3,
        },
      ],
    });
  }

  // Site photos. Replace an empty value or the old illustrated placeholder; keep anything the owner chose.
  for (const [key, url] of [["giftBoxImage", images.site["gift-box"]], ["storyImage", images.site["story"]]] as const) {
    if (!url) continue;
    const row = await prisma.setting.findUnique({ where: { key } });
    if (!row || !row.value || row.value.includes("chique-bags/seed/")) {
      await prisma.setting.upsert({ where: { key }, create: { key, value: url }, update: { value: url } });
    }
  }

  console.log(`Seed complete. Admin: ${adminEmail}. ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
