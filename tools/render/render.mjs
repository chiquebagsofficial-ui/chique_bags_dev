// Renders studio-style product images with three.js inside headless Chrome.
// Usage: node render.mjs [slug-or-key ...]   (no args = everything)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { JOBS } from "./catalog.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "out");
fs.mkdirSync(out, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const file = path.join(here, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(here) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(5599, r));

const chrome = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const page = await browser.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("[page]", m.text()); });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.setViewport({ width: 1000, height: 1250 });
await page.goto("http://localhost:5599/scene.html");
await page.waitForFunction("window.sceneReady === true", { timeout: 60000 });

const only = process.argv.slice(2);
const jobs = JOBS.filter((j) => only.length === 0 || only.some((o) => j.key.startsWith(o)));
for (const job of jobs) {
  const t = Date.now();
  await page.setViewport({ width: job.width ?? 1000, height: job.height ?? 1250 });
  await page.evaluate((j) => window.renderJob(j), job);
  const el = await page.$("canvas");
  await el.screenshot({ path: path.join(out, `${job.key}.jpg`), type: "jpeg", quality: 90 });
  console.log(`rendered ${job.key} in ${Date.now() - t}ms`);
}
await browser.close();
server.close();
