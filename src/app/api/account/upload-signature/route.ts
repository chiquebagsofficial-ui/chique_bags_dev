import { v2 as cloudinary } from "cloudinary";
import { fail, limit, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Signed direct-to-Cloudinary upload for customers' return photos. Login required, rate limited.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail("Please log in.", 401);
  const limited = await limit(req, "upload-sig", 30, 60 * 60_000, user.id);
  if (limited) return limited;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return fail("Photo upload isn't available right now.", 503);

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "chique-bags/returns";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
  return ok({ cloudName, apiKey, timestamp, folder, signature });
}
