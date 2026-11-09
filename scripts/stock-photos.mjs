// Real stock photographs (Unsplash, free licence) used as placeholder imagery until the
// client's own product photos are added. Uploads each one to Cloudinary BY URL (Cloudinary
// fetches it, nothing is downloaded locally) and writes prisma/seed-images.json.
// Run: node scripts/stock-photos.mjs     (needs the Cloudinary keys in .env)
import fs from "node:fs";
import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config({ override: true });
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const unsplash = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=max&w=${w}&q=85`;

// product slug -> Unsplash photo ids (first one is the cover)
export const PRODUCT_PHOTOS = {
  "the-petite-crescent-sling": ["1585488574812-4860e867b31f"],
  "aura-quilted-chain-clutch": ["1783700475749-6e6521a503fa", "1783700475349-46e60e2c959c"],
  "coral-chain-sling": ["1585488433963-2e35fb083e52"],
  "rose-quilted-top-handle-bag": ["1681747685985-a401c271156c"],
  "blush-turn-lock-satchel": ["1591656852283-29bed2fe05ee"],
  "petal-pink-mini-flap-bag": ["1683921590274-a83862cb11c3"],
  "midnight-bucket-chain-bag": ["1668435734524-f56709d4403e"],
  "saddle-tan-crossbody": ["1484527273420-c598cb0601f8"],
  "metro-daily-camera-pouch": ["1620786514669-06e2340fce71", "1620786514684-ff35b5aae55e"],
  "cognac-woven-chain-tote": ["1598532163257-ae3c6b2524b6"],
  "slate-buckle-satchel": ["1605733513597-a8f8341084e6"],
  "cocoa-leather-messenger": ["1657603738389-951c374b740c", "1657603719375-8ffdacaac790"],
};

// site imagery
export const SITE_PHOTOS = {
  "banner-new-season": "1523779105320-d1cd346ff52b",
  "banner-gifting": "1646182504823-a02b768e28b5",
  "banner-collection": "1785153255448-3961697009f9",
  "gift-box": "1513201099705-a9746e1e201f",
  story: "1524498250077-390f9e378fc0",
  "category-crossbody": "1760624294514-ca40aafe3d96",
};

async function up(key, id, w) {
  const res = await cloudinary.uploader.upload(unsplash(id, w), { public_id: `chique-bags/stock/${key}`, overwrite: true, resource_type: "image" });
  console.log("uploaded", key);
  return res.secure_url;
}

const out = { site: {}, products: {} };
for (const [key, id] of Object.entries(SITE_PHOTOS)) out.site[key] = await up(key, id, key.startsWith("banner") ? 2400 : 1600);
for (const [slug, ids] of Object.entries(PRODUCT_PHOTOS)) {
  out.products[slug] = [];
  for (const [i, id] of ids.entries()) out.products[slug].push(await up(`${slug}-${i + 1}`, id, 1400));
}
fs.writeFileSync("prisma/seed-images.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote prisma/seed-images.json");
