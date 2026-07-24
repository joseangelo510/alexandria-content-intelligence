import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const fetchWorker = typeof worker === "function" ? worker : worker.fetch.bind(worker);

  return fetchWorker(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the judge-ready Alexandria experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Alexandria — Content Intelligence/);
  assert.match(html, /Every website has become its own Alexandria/);
  assert.match(html, /Two thousand years ago, Alexandria attempted to collect everything humanity knew/);
  assert.match(html, /The first Alexandria burned\. The modern one decays one outdated page at a time\./);
  assert.match(html, /I’m Jose\. I own an SEO agency/);
  assert.match(html, /You\.com Search API/);
  assert.match(html, /You\.com Contents API/);
  assert.match(html, /You\.com Research API/);
  assert.match(html, /Three APIs turn change into action\./);
  assert.match(html, /Replit Autoscale/);
  assert.match(html, /LlamaIndex/);
  assert.doesNotMatch(html, /Cloudflare Workers via Sites/);
  assert.match(html, /Search/);
  assert.match(html, /Contents/);
  assert.match(html, /Research/);
  assert.match(html, /Human approval required/);
  assert.match(html, /Scan any website with my You\.com key/);
  assert.match(html, /Download one-pager/);
  assert.match(html, /View project requirements/);
  assert.match(html, /alexandria-social\.png/);
});

test("keeps all You.com credentials server-side and implements the three-stage pipeline", async () => {
  const [route, page] = await Promise.all([
    readFile(new URL("../app/api/scan/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(route, /process\.env\.YDC_API_KEY/);
  assert.match(route, /runYouComScan/);
  assert.match(route, /sessionApiKey/);
  assert.match(route, /The live scan could not be completed/);
  assert.doesNotMatch(page, /YDC_API_KEY|X-API-Key/);
  assert.match(page, /Before and after/);
  assert.match(page, /Download content patch/);
  assert.match(page, /data:text\/markdown;charset=utf-8/);
  assert.match(page, /alexandria-content-patch-/);
  assert.match(page, /Publishing requires an authenticated CMS connection/);
  assert.doesNotMatch(page, /Renaissance/i);
  await access(new URL("../public/alexandria-social.png", import.meta.url));
  await access(new URL("../public/alexandria-one-pager.pdf", import.meta.url));
  await access(new URL("../public/alexandria-project-requirements.md", import.meta.url));
});
