import { config } from "dotenv";
config({ override: true });
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Image URLs come from tools/render (studio renders uploaded to Cloudinary).
const images: { giftBox: string; products: Record<string, string[]> } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "seed-images.json"), "utf8")
);
const first = (slug: string) => images.products[slug]?.[0] ?? null;

const categories = [
  { name: "Crescent Slings", slug: "crescent-slings", description: "Soft half-moon silhouettes that sit right at your hip.", image: first("the-petite-crescent-sling"), sortOrder: 10 },
  { name: "Quilted & Chain", slug: "quilted-chain", description: "Quilted textures with gold-finish chain straps.", image: first("aura-quilted-gold-chain-sling"), sortOrder: 20 },
  { name: "Crossbody Bags", slug: "crossbody-bags", description: "Everyday crossbodies sized for the essentials.", image: first("cloud-puffer-crossbody-sling"), sortOrder: 30 },
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
  { name: "The Petite Crescent Sling", slug: "the-petite-crescent-sling", category: "crescent-slings", price: 1299, mrp: 2199, short: "A half-moon sling in premium vegan leather with a gold-finish zip and a flat shoulder strap.", tags: ["crescent", "bestseller", "pink"], flags: { isBestSeller: true, isFeatured: true }, dimensions: "26 cm wide × 13 cm high × 5 cm deep", colours: [["Dusty Rose", "#d98ba4", 14], ["Onyx Black", "#222222", 10], ["Ivory Cream", "#ede6dd", 8]] },
  { name: "Aura Quilted Gold-Chain Sling", slug: "aura-quilted-gold-chain-sling", category: "quilted-chain", price: 1499, mrp: 2499, short: "Diamond-quilted flap sling with a turn-lock clasp and a removable gold-finish chain strap.", tags: ["chain", "quilted", "black", "bestseller"], flags: { isBestSeller: true, isFeatured: true }, dimensions: "24 cm wide × 15 cm high × 7 cm deep", colours: [["Matte Black", "#181818", 12], ["Metallic Gold", "#d4af37", 6]] },
  { name: "Cloud Puffer Crossbody Sling", slug: "cloud-puffer-crossbody-sling", category: "crossbody-bags", price: 899, mrp: 1599, short: "A soft, channel-puffed crossbody that feels like carrying a cloud.", tags: ["under999", "puffer", "crossbody"], flags: { isFeatured: true }, dimensions: "26 cm wide × 16 cm high × 9 cm deep", colours: [["Sage Green", "#9fb59a", 9], ["Cloud Pink", "#f4cbd8", 9], ["Black", "#222222", 12]] },
  { name: "Petite Structured Mini Sling", slug: "petite-structured-mini-sling", category: "crescent-slings", price: 949, mrp: 1699, short: "A structured mini sling, just big enough for phone, cards and lip balm.", tags: ["under999", "crescent", "mini"], flags: {}, dimensions: "17 cm wide × 12 cm high × 6 cm deep", colours: [["Nude Tan", "#d9c8b4", 11], ["Chalk White", "#ffffff", 7]] },
  { name: "Parisian Vegan Leather Sling", slug: "parisian-vegan-leather-sling", category: "quilted-chain", price: 1399, mrp: 2299, short: "Smooth vegan leather with a turn-lock flap and chain strap, made for city evenings.", tags: ["chain", "burgundy", "bestseller"], flags: { isNew: true, isBestSeller: true }, dimensions: "23 cm wide × 15 cm high × 7 cm deep", colours: [["Burgundy", "#5a1f2a", 8], ["Classic Black", "#111111", 10]] },
  { name: "Metro Daily Crossbody Pouch", slug: "metro-daily-crossbody-pouch", category: "crossbody-bags", price: 799, mrp: 1399, short: "A no-fuss daily pouch with a zip top, front zip pocket and adjustable strap.", tags: ["under999", "crossbody", "daily"], flags: { isNew: true }, dimensions: "22 cm wide × 15 cm high × 6.5 cm deep", colours: [["Charcoal", "#2c2c30", 15], ["Mocha", "#9e8e7a", 10]] },
  { name: "Velvet Shimmer Evening Sling", slug: "velvet-shimmer-evening-sling", category: "quilted-chain", price: 1599, mrp: 2699, short: "A shimmer-finish quilted evening sling with a gold chain for party nights.", tags: ["party", "chain", "quilted", "shimmer"], flags: { isNew: true }, dimensions: "22 cm wide × 14 cm high × 7 cm deep", colours: [["Blush Shimmer", "#e8a9bd", 6], ["Champagne Gold", "#d4af37", 5]] },
  { name: "Caramel Latte Explorer Sling", slug: "caramel-latte-explorer-sling", category: "crossbody-bags", price: 1199, mrp: 1999, short: "Roomy enough for a small water bottle, stylish enough for brunch.", tags: ["bestseller", "crossbody", "tan"], flags: { isBestSeller: true }, dimensions: "24 cm wide × 17 cm high × 8 cm deep", colours: [["Caramel Latte", "#a06b45", 10], ["Onyx", "#222222", 10]] },
  { name: "Ivory Pearl Crescent Mini", slug: "ivory-pearl-crescent-mini", category: "crescent-slings", price: 1099, mrp: 1799, short: "A petite ivory half-moon with a gold chain strap. Small bag, big statement.", tags: ["crescent", "ivory", "mini", "chain"], flags: { isNew: true }, dimensions: "21 cm wide × 10.5 cm high × 4 cm deep", colours: [["Ivory", "#efe6d6", 9], ["Blush", "#f1c3cf", 6]] },
  { name: "Midnight Quilted Mini Chain Bag", slug: "midnight-quilted-mini-chain-bag", category: "quilted-chain", price: 1349, mrp: 2199, short: "A mini quilted flap bag in deep midnight blue with a polished gold chain.", tags: ["chain", "quilted", "navy", "mini"], flags: { isNew: true }, dimensions: "19 cm wide × 13 cm high × 6 cm deep", colours: [["Midnight Blue", "#1f2b4d", 8], ["Black", "#181818", 8]] },
  { name: "Blush Puffer Mini Pouch", slug: "blush-puffer-mini-pouch", category: "crossbody-bags", price: 849, mrp: 1499, short: "A mini puffer pouch in soft blush with a zip top and adjustable strap.", tags: ["under999", "puffer", "mini", "pink"], flags: {}, dimensions: "21 cm wide × 14 cm high × 8 cm deep", colours: [["Blush", "#ea9fb4", 12], ["Sage", "#9fb59a", 8]] },
  { name: "Olive Everyday Crossbody", slug: "olive-everyday-crossbody", category: "crossbody-bags", price: 999, mrp: 1699, short: "An easy olive-green crossbody with a zip top and a roomy front pocket.", tags: ["under999", "crossbody", "daily", "olive"], flags: { isBestSeller: true }, dimensions: "23 cm wide × 16 cm high × 7 cm deep", colours: [["Olive", "#6b7350", 10], ["Charcoal", "#2c2c30", 10]] },
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
      update: { description: c.description, image: c.image, sortOrder: c.sortOrder },
    });
  }
  const cats = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of products) {
    const photos = images.products[p.slug] ?? [];
    const shared = {
      name: p.name,
      categoryId: cats.get(p.category)!,
      price: p.price,
      originalPrice: p.mrp,
      shortDescription: p.short,
      description: `${p.short}\n\nHandcrafted with care in India from premium, cruelty-free vegan leather. Gold-finish hardware, a soft cotton lining and a strap you can adjust to sit exactly where you like.`,
      images: photos,
      features: ["100% cruelty-free vegan leather", "Gold-finish hardware", "Adjustable crossbody strap", "Soft cotton lining", "Handcrafted in India"],
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

  // Gift box photo (editable later in Admin > Settings)
  if (images.giftBox) {
    await prisma.setting.upsert({ where: { key: "giftBoxImage" }, create: { key: "giftBoxImage", value: images.giftBox }, update: { value: images.giftBox } });
  }

  console.log(`Seed complete. Admin: ${adminEmail}. ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
