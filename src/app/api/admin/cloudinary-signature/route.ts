import { v2 as cloudinary } from "cloudinary";
import { adminGuard, fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// Signs a direct browser-to-Cloudinary upload so the API secret never leaves the server.
export async function POST() {
  const denied = await adminGuard();
  if (denied) return denied;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return fail("Photo upload isn't set up yet. Paste image links instead.", 503);

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "chique-bags/products";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
  return ok({ cloudName, apiKey, timestamp, folder, signature });
}
