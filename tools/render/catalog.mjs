// Product definitions for the studio renders. `slug` must match the product slug in the database.
const PINK = ["#fdf2f5", "#f1cfda"];
const CREAM = ["#fbf7f2", "#e9ddcf"];
const SAGE = ["#f4f7f2", "#d3ddd0"];
const MOCHA = ["#f7f0e9", "#d8c3af"];
const SLATE = ["#f4f5f9", "#d1d7e5"];
const BLUSH = ["#fff5f7", "#efc9d4"];

export const PRODUCTS = [
  { slug: "the-petite-crescent-sling", bg: PINK, cfg: { shape: "crescent", r: 12.5, w: 27, h: 14, d: 4.6, color: "#d98ba4", rough: 0.46, clear: 0.45, strap: "leather", lift: 12, elev: 0.3 } },
  { slug: "aura-quilted-gold-chain-sling", bg: CREAM, cfg: { w: 24, h: 15, d: 7, radius: 1.9, quilt: [5, 3.5], quiltDepth: 3, flap: 0.52, lock: "turn", strap: "chain", color: "#1b1b1d", rough: 0.4, clear: 0.55, lift: 13 } },
  { slug: "cloud-puffer-crossbody-sling", bg: SAGE, cfg: { w: 26, h: 16, d: 9, radius: 4.2, channels: 4, quiltDepth: 3.6, zip: true, strap: "leather", strapW: 2.4, color: "#9fb59a", rough: 0.62, clear: 0.12, sheen: 0.2, lift: 13 } },
  { slug: "petite-structured-mini-sling", bg: MOCHA, cfg: { w: 17, h: 12.5, d: 6, radius: 1.3, flap: 0.55, lock: "bar", strap: "chain", color: "#d9c8b4", rough: 0.38, clear: 0.6, lift: 11 } },
  { slug: "parisian-vegan-leather-sling", bg: BLUSH, cfg: { w: 23, h: 15, d: 7, radius: 1.6, flap: 0.5, lock: "turn", strap: "chain", color: "#5a1f2a", rough: 0.36, clear: 0.65, lift: 13 } },
  { slug: "metro-daily-crossbody-pouch", bg: SLATE, cfg: { w: 22, h: 15, d: 6.5, radius: 1.8, zip: true, pocket: true, pocketZip: true, strap: "leather", strapW: 2.2, color: "#2c2c30", rough: 0.5, clear: 0.3, lift: 13 } },
  { slug: "velvet-shimmer-evening-sling", bg: PINK, cfg: { w: 22, h: 14, d: 7, radius: 1.7, quilt: [6, 4], quiltDepth: 3, flap: 0.5, lock: "turn", strap: "chain", color: "#e8a9bd", rough: 0.28, clear: 0.7, metal: 0.45, sheen: 1, lift: 13 } },
  { slug: "caramel-latte-explorer-sling", bg: MOCHA, cfg: { w: 24, h: 17, d: 8, radius: 2.2, flap: 0.5, lock: "bar", pocket: false, strap: "leather", strapW: 2.3, color: "#a06b45", rough: 0.5, clear: 0.35, lift: 11 } },
  { slug: "ivory-pearl-crescent-mini", bg: CREAM, cfg: { shape: "crescent", r: 10, w: 22, h: 11, d: 4, color: "#efe6d6", rough: 0.42, clear: 0.5, strap: "chain", lift: 11, elev: 0.3 } },
  { slug: "midnight-quilted-mini-chain-bag", bg: SLATE, cfg: { w: 19, h: 13, d: 6, radius: 1.6, quilt: [4.5, 3], quiltDepth: 3, flap: 0.5, lock: "turn", strap: "chain", color: "#1f2b4d", rough: 0.4, clear: 0.55, lift: 11 } },
  { slug: "blush-puffer-mini-pouch", bg: BLUSH, cfg: { w: 21, h: 14, d: 8, radius: 3.8, channels: 3, quiltDepth: 3.6, zip: true, strap: "leather", strapW: 2.2, color: "#ea9fb4", rough: 0.6, clear: 0.12, sheen: 0.2, lift: 12 } },
  { slug: "olive-everyday-crossbody", bg: SAGE, cfg: { w: 23, h: 16, d: 7, radius: 1.9, zip: true, pocket: true, strap: "leather", strapW: 2.2, color: "#6b7350", rough: 0.52, clear: 0.28, lift: 13 } },
];

const VIEWS = [
  ["three", {}],
  ["front", {}],
  ["detail", {}],
];

export const JOBS = [
  ...PRODUCTS.flatMap((p) => VIEWS.map(([view, extra]) => ({ key: `${p.slug}__${view}`, kind: "bag", view, bg: p.bg, cfg: p.cfg, ...extra }))),
  {
    key: "gift-box",
    kind: "gift",
    view: "three",
    width: 1200,
    height: 1200,
    bg: ["#fff7f9", "#f0c8d4"],
    zoom: 1.12,
    targetY: 0.52,
    cfg: { w: 30, d: 22, color: "#f2bac9", note: "Happy birthday!|Love, Anaya" },
  },
];
