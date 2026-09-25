// Real-browser regression test: the guided FROM/TO Journal form must be
// VISIBLE, not just present in the DOM.
//
// Background: app/layout.tsx wraps routes in a motion.div with a permanent
// perspective transform, which hijacked the containing block of the
// position:fixed drawer and pushed the panel ~550px off-screen (only the
// footer showed). jsdom cannot catch this — getBoundingClientRect() is
// always 0 there — so this test drives a real Chromium-family browser
// against the production build and asserts nonzero rendered dimensions.
//
// Usage: npm run build && npm run test:e2e
// Requires a Chromium-family browser: Edge/Chrome on PATH, one of the
// well-known install locations, or CHROME_PATH env.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const SHOT_DIR = path.join(ROOT, "e2e", "screenshots");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon" };

function fail(msg) {
  console.error(`E2E FAIL: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  fail("dist/ missing — run `npm run build` first.");
}
const executablePath = CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  fail("no Chromium-family browser found (set CHROME_PATH).");
}
fs.mkdirSync(SHOT_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  let file = path.join(DIST, urlPath);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4179, "127.0.0.1", r));

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1280,900", "--force-device-scale-factor=1"],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
});
const failures = [];
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures.push(name);
};

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.goto("http://127.0.0.1:4179/journal", { waitUntil: "networkidle0" });

  // Fresh profile → vault setup, then straight into the app.
  await page.waitForSelector('input[placeholder="Enter passphrase (min 8 characters)"]');
  await page.type('input[placeholder="Enter passphrase (min 8 characters)"]', "correct horse battery staple");
  await page.type('input[placeholder="Confirm passphrase"]', "correct horse battery staple");
  await page.click('input[type="checkbox"]');
  await (await page.waitForSelector("button::-p-text(Initialize Vault)")).click();
  await new Promise((r) => setTimeout(r, 9000));

  await (await page.waitForSelector("button::-p-text(New Entry)", { timeout: 60000 })).click();
  await page.waitForFunction(() => {
    const h = [...document.querySelectorAll("h2")].find((e) => e.textContent.includes("Journal Entry"));
    const wrap = h ? h.closest("div.fixed") : null;
    return !!(wrap && !wrap.className.includes("hidden"));
  }, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2500));

  const geom = await page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom }; };
    const drawer = document.querySelector('[data-testid="journal-drawer"]');
    const wrap = drawer;
    const panel = wrap.querySelector(":scope > div.relative");
    const fields = {};
    for (const name of ["Line 1 account", "Line 1 amount", "Line 2 account", "Line 2 amount"]) {
      const el = document.querySelector(`[aria-label="${name}"]`);
      fields[name] = el ? r(el) : null;
    }
    return {
      inner: { w: window.innerWidth, h: window.innerHeight },
      drawerParentIsBody: drawer.parentElement === document.body,
      wrap: r(wrap),
      panel: r(panel),
      fields,
    };
  });

  check("drawer overlay is portaled to document.body", geom.drawerParentIsBody);
  check("overlay fills the viewport", Math.round(geom.wrap.w) === 1280 && Math.round(geom.wrap.h) === 900, `${Math.round(geom.wrap.w)}x${Math.round(geom.wrap.h)}`);
  check("panel is bottom-pinned to the viewport", Math.abs(geom.panel.bottom - 900) < 3, `panel bottom=${Math.round(geom.panel.bottom)}`);
  for (const [name, b] of Object.entries(geom.fields)) {
    check(`${name} rendered with nonzero size`, !!b && b.h > 0 && b.w > 0, b ? `${Math.round(b.w)}x${Math.round(b.h)} @y=${Math.round(b.y)}` : "missing");
  }

  await page.screenshot({ path: path.join(SHOT_DIR, "journal-drawer.png") });
  console.log(`screenshot: e2e/screenshots/journal-drawer.png`);
} finally {
  await browser.close();
  server.close();
}

if (failures.length > 0) fail(`${failures.length} check(s) failed`);
console.log("E2E OK: guided Journal form is visible.");
