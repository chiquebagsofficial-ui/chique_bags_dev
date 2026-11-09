import { cache } from "react";
import { prisma } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  announcement: "Launch special: flat 15% off your first order. Use code CHIQUE15",
  freeShippingThreshold: "999",
  shippingFee: "79",
  codEnabled: "true",
  codFee: "0",
  giftBoxEnabled: "true",
  giftBoxFee: "149",
  giftBoxImage: "",
  storyImage: "",
  contactEmail: "hello@chiquebags.in",
  contactPhone: "",
  whatsapp: "",
  instagram: "https://www.instagram.com/chiquebagsofficial/",
  address: "India",
  ownerEmail: "",
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = {
  announcement: string;
  freeShippingThreshold: number;
  shippingFee: number;
  codEnabled: boolean;
  codFee: number;
  giftBoxEnabled: boolean;
  giftBoxFee: number;
  giftBoxImage: string;
  storyImage: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  ownerEmail: string;
};

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const raw: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) raw[r.key] = r.value;
  return {
    announcement: raw.announcement,
    freeShippingThreshold: Number(raw.freeShippingThreshold) || 0,
    shippingFee: Number(raw.shippingFee) || 0,
    codEnabled: raw.codEnabled === "true",
    codFee: Number(raw.codFee) || 0,
    giftBoxEnabled: raw.giftBoxEnabled === "true",
    giftBoxFee: Number(raw.giftBoxFee) || 0,
    giftBoxImage: raw.giftBoxImage,
    storyImage: raw.storyImage,
    contactEmail: raw.contactEmail,
    contactPhone: raw.contactPhone,
    whatsapp: raw.whatsapp,
    instagram: raw.instagram,
    address: raw.address,
    ownerEmail: raw.ownerEmail || process.env.OWNER_EMAIL || "",
  };
});

export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
}
