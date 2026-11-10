import { cache } from "react";
import { prisma } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  announcement: "Free shipping on every order · Prepaid orders, delivered across India",
  giftBoxEnabled: "true",
  giftBoxFee: "200",
  giftBoxImage: "",
  storyImage: "",
  contactEmail: "hello@chiquebags.in",
  contactPhone: "",
  whatsapp: "",
  instagram: "https://www.instagram.com/chiquebagsofficial/",
  address: "India",
  ownerEmail: "",
  // GST / invoice details
  legalName: "Chique Bags",
  gstin: "",
  gstRate: "18",
  hsnCode: "4202",
  businessState: "",
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = {
  announcement: string;
  giftBoxEnabled: boolean;
  giftBoxFee: number;
  giftBoxImage: string;
  storyImage: string;
  contactEmail: string;
  contactPhone: string;
  /** WhatsApp number with country code, digits only, e.g. 919876543210 */
  whatsapp: string;
  instagram: string;
  address: string;
  ownerEmail: string;
  legalName: string;
  gstin: string;
  gstRate: number;
  hsnCode: string;
  businessState: string;
};

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const raw: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) raw[r.key] = r.value;
  return {
    announcement: raw.announcement,
    giftBoxEnabled: raw.giftBoxEnabled === "true",
    giftBoxFee: Number(raw.giftBoxFee) || 0,
    giftBoxImage: raw.giftBoxImage,
    storyImage: raw.storyImage,
    contactEmail: raw.contactEmail,
    contactPhone: raw.contactPhone,
    whatsapp: (raw.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
    instagram: raw.instagram,
    address: raw.address,
    ownerEmail: raw.ownerEmail || process.env.OWNER_EMAIL || "",
    legalName: raw.legalName,
    gstin: raw.gstin.trim().toUpperCase(),
    gstRate: Number(raw.gstRate) || 0,
    hsnCode: raw.hsnCode,
    businessState: raw.businessState,
  };
});

export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
}
