-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaText" TEXT,
    "ctaHref" TEXT,
    "cta2Text" TEXT,
    "cta2Href" TEXT,
    "image" TEXT NOT NULL,
    "imageMobile" TEXT,
    "focus" TEXT NOT NULL DEFAULT 'center',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
