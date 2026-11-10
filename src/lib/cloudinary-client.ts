/** Uploads images from the browser straight to Cloudinary using a server-signed request. */
export async function uploadImages(files: FileList | File[], signatureEndpoint = "/api/admin/cloudinary-signature"): Promise<string[]> {
  const sigRes = await fetch(signatureEndpoint, { method: "POST" });
  const sig = await sigRes.json();
  if (!sigRes.ok) throw new Error(sig.error ?? "Upload is not set up");
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    if (file.size > 10 * 1024 * 1024) throw new Error("Each photo must be under 10 MB.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sig.apiKey);
    fd.append("timestamp", String(sig.timestamp));
    fd.append("folder", sig.folder);
    fd.append("signature", sig.signature);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
    urls.push(data.secure_url);
  }
  return urls;
}
