// Uploads the rendered images in ./out to Cloudinary and writes prisma/seed-images.json,
// which the database seed uses to attach photos to products.
// Needs NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the repo .env.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { PRODUCTS } from "./catalog.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
config({ path: path.join(root, ".env"), override: true });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const out = path.join(here, "out");
const files = fs.readdirSync(out).filter((f) => f.endsWith(".jpg"));
const urls = {};
for (const f of files) {
  const key = f.replace(/\.jpg$/, "");
  const res = await cloudinary.uploader.upload(path.join(out, f), {
    public_id: `chique-bags/seed/${key}`,
    overwrite: true,
    resource_type: "image",
  });
  urls[key] = res.secure_url;
  console.log("uploaded", key);
}

const products = {};
for (const p of PRODUCTS) {
  products[p.slug] = ["three", "front", "detail"].map((v) => urls[`${p.slug}__${v}`]).filter(Boolean);
}
const result = { giftBox: urls["gift-box"] ?? "", products };
fs.writeFileSync(path.join(root, "prisma/seed-images.json"), JSON.stringify(result, null, 2) + "\n");
console.log("wrote prisma/seed-images.json");
