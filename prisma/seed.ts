import { config } from "dotenv";
config({ override: true });
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
const PHOTOS = {
  a: "1594223274512-ad4803739b7c",
  b: "1584917865442-de89df76afd3",
  c: "1548036328-c9fa89d128fa",
  d: "1591561954557-26941169b49e",
  e: "1566150905458-1bf1fc113f0d",
  f: "1575032617751-6ddec2089882",
  g: "1590874103328-eac38a683ce7",
};
const gallery = (...ids: (keyof typeof PHOTOS)[]) => ids.map((i) => img(PHOTOS[i]));

const categories = [
  { name: "Crescent Slings", slug: "crescent-slings", description: "Soft half-moon silhouettes that sit right at your hip.", image: img(PHOTOS.a, 800), sortOrder: 10 },
  { name: "Quilted & Chain", slug: "quilted-chain", description: "Quilted textures with gold-finish chain straps.", image: img(PHOTOS.b, 800), sortOrder: 20 },
  { name: "Crossbody Bags", slug: "crossbody-bags", description: "Everyday crossbodies sized for the essentials.", image: img(PHOTOS.c, 800), sortOrder: 30 },
];

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  mrp: number;
  short: string;
  tags: string[];
  flags: { isNew?: boolean; isBestSeller?: boolean; isFeatured?: boolean };
  photos: (keyof typeof PHOTOS)[];
  colours: [string, string, number][];
};

const products: SeedProduct[] = [
  { name: "The Petite Crescent Sling", category: "crescent-slings", price: 1299, mrp: 2199, short: "A half-moon sling in premium vegan leather with a gold-finish clasp.", tags: ["crescent", "bestseller", "pink"], flags: { isBestSeller: true, isFeatured: true }, photos: ["a", "b", "e"], colours: [["Dusty Rose", "#f4cbd8", 14], ["Onyx Black", "#222222", 10], ["Ivory Cream", "#ede6dd", 8]] },
  { name: "Aura Quilted Gold-Chain Sling", category: "quilted-chain", price: 1499, mrp: 2499, short: "Diamond-quilted sling with a removable gold-finish chain strap.", tags: ["chain", "quilted", "black", "bestseller"], flags: { isBestSeller: true, isFeatured: true }, photos: ["b", "g", "a"], colours: [["Matte Black", "#181818", 12], ["Metallic Gold", "#d4af37", 6]] },
  { name: "Cloud Puffer Crossbody Sling", category: "crossbody-bags", price: 899, mrp: 1599, short: "A soft, puffed crossbody that feels like carrying a cloud.", tags: ["under999", "puffer", "crossbody"], flags: { isFeatured: true }, photos: ["c", "d", "e"], colours: [["Sage Green", "#b7c4b4", 9], ["Cloud Pink", "#f4cbd8", 9], ["Black", "#222222", 12]] },
  { name: "Petite Structured Mini Sling", category: "crescent-slings", price: 949, mrp: 1699, short: "A structured mini sling, just big enough for phone, cards and lip balm.", tags: ["under999", "crescent", "mini"], flags: {}, photos: ["d", "a", "f"], colours: [["Nude Tan", "#dfd2c4", 11], ["Chalk White", "#ffffff", 7]] },
  { name: "Parisian Vegan Leather Sling", category: "quilted-chain", price: 1399, mrp: 2299, short: "Smooth vegan leather with a chain detail, made for city evenings.", tags: ["chain", "burgundy", "bestseller"], flags: { isNew: true, isBestSeller: true }, photos: ["e", "g", "b"], colours: [["Burgundy", "#5e2129", 8], ["Classic Black", "#111111", 10]] },
  { name: "Metro Daily Crossbody Pouch", category: "crossbody-bags", price: 799, mrp: 1399, short: "A no-fuss daily pouch with a zip top and adjustable strap.", tags: ["under999", "crossbody", "daily"], flags: { isNew: true }, photos: ["f", "c", "d"], colours: [["Charcoal", "#2d2d2d", 15], ["Mocha", "#9e8e7a", 10]] },
  { name: "Velvet Shimmer Evening Sling", category: "quilted-chain", price: 1599, mrp: 2699, short: "A shimmer-finish evening sling with a gold chain for party nights.", tags: ["party", "chain", "crescent", "shimmer"], flags: { isNew: true }, photos: ["g", "b", "a"], colours: [["Blush Shimmer", "#e4a5b8", 6], ["Champagne Gold", "#d4af37", 5]] },
  { name: "Caramel Latte Explorer Sling", category: "crossbody-bags", price: 1199, mrp: 1999, short: "Roomy enough for a small water bottle, stylish enough for brunch.", tags: ["bestseller", "crossbody", "tan"], flags: { isBestSeller: true }, photos: ["c", "f", "d"], colours: [["Caramel Latte", "#a57551", 10], ["Onyx", "#222222", 10]] },
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
    await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: { description: c.description, image: c.image, sortOrder: c.sortOrder } });
  }
  const cats = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        categoryId: cats.get(p.category)!,
        price: p.price,
        originalPrice: p.mrp,
        shortDescription: p.short,
        description:
          `${p.short}\n\nHandcrafted with care in India from premium, cruelty-free vegan leather. Gold-finish hardware, a soft cotton lining and a strap you can adjust to sit exactly where you like.`,
        images: gallery(...p.photos),
        features: ["100% cruelty-free vegan leather", "Gold-finish hardware", "Adjustable crossbody strap", "Soft cotton lining", "Handcrafted in India"],
        tags: p.tags,
        material: "Premium vegan leather",
        dimensions: "22 cm wide × 14 cm high × 6 cm deep",
        careInstructions: "Wipe with a soft, dry cloth. Keep away from water, heat and sharp objects. Store in the dust bag provided.",
        ...p.flags,
        variants: { create: p.colours.map(([name, hex, stock], i) => ({ name, hex, stock, sortOrder: i })) },
      },
    });
  }

  const coupons = [
    { code: "CHIQUE15", description: "Flat 15% off your first order", type: "PERCENTAGE" as const, value: 15, maxDiscount: 500, minOrder: 0, oncePerUser: true },
    { code: "CHIQUE150", description: "₹150 off orders above ₹999", type: "FLAT" as const, value: 150, minOrder: 999, oncePerUser: true },
  ];
  for (const c of coupons) await prisma.coupon.upsert({ where: { code: c.code }, create: c, update: {} });

  console.log(`Seed complete. Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
