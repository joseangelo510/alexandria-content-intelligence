import assert from "node:assert/strict";
import test from "node:test";

import { indexPageEvidence, normalizeDomain, runYouComScan, YouComScanError } from "../lib/you-com.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("normalizes full website URLs into a crawlable domain", () => {
  assert.equal(normalizeDomain("https://www.example.com/articles/page?q=1"), "www.example.com");
  assert.equal(normalizeDomain("example.com/path"), "example.com");
  assert.equal(normalizeDomain("not a website"), "");
});

test("uses LlamaIndex to preserve volatile evidence from across long pages", () => {
  const result = indexPageEvidence([{
    url: "https://example.com/long-guide",
    title: "Long guide",
    markdown: `${"Evergreen background sentence. ".repeat(900)}The 2026 deadline is now September 1 and the fee is $42.`,
  }]);

  assert.ok(result.chunkCount > 1);
  assert.equal(result.selectedCount, 1);
  assert.match(result.text, /2026 deadline is now September 1/);
});

test("runs Search, Contents, and Research and returns an editor-ready patch", async () => {
  const calls = [];
  const responses = [
    jsonResponse({
      results: {
        web: [
          {
            url: "https://example.com/guide",
            title: "Old guide",
            description: "A guide with a dated statistic",
          },
          { url: "https://unrelated.test/page", title: "Ignore me" },
        ],
      },
    }),
    jsonResponse({
      output: [{ url: "https://example.com/guide", title: "Old guide", markdown: "The price is $10." }],
    }),
    jsonResponse({
      output: {
        content: JSON.stringify({
          signals: [{
            title: "Old guide",
            url: "https://example.com/guide",
            section: "Pricing",
            issue: "The official price is now $12.",
            oldClaim: "The price is $10.",
            proposedCopy: "The price is $12.",
            sourceName: "Official pricing",
            sourceUrl: "https://authority.test/pricing",
            severity: "High",
            confidence: 0.964,
          }],
        }),
      },
    }),
  ];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return responses.shift();
  };

  const result = await runYouComScan({ domain: "example.com", apiKey: "test-key", fetchImpl });

  assert.deepEqual(calls.map((call) => call.url), [
    "https://ydc-index.io/v1/search",
    "https://ydc-index.io/v1/contents",
    "https://api.you.com/v1/research",
  ]);
  assert.equal(calls[0].init.headers["X-API-Key"], "test-key");
  assert.equal(calls[0].body.count, 25);
  assert.deepEqual(calls[1].body.urls, ["https://example.com/guide"]);
  assert.equal(calls[2].body.research_effort, "standard");
  assert.equal(result.mode, "live-you-com");
  assert.equal(result.analyzedPageCount, 1);
  assert.equal(result.signals.length, 1);
  assert.equal(result.signals[0].url, "example.com/guide");
  assert.equal(result.signals[0].proposedCopy, "The price is $12.");
  assert.equal(result.signals[0].confidence, 96);
  assert.deepEqual(result.apiTrace.map((stage) => stage.api), ["Search", "Contents", "LlamaIndex", "Research"]);
});

test("scans 25 priority pages in Contents API batches of no more than 10", async () => {
  const calls = [];
  const searchResults = Array.from({ length: 25 }, (_, index) => ({
    url: `https://example.com/page-${index + 1}`,
    title: `Page ${index + 1}`,
    description: `Current information for page ${index + 1}`,
  }));
  const responses = [
    jsonResponse({ results: { web: searchResults } }),
    jsonResponse({ output: searchResults.slice(0, 10).map((result) => ({ ...result, markdown: `${result.title} policy updated in 2026.` })) }),
    jsonResponse({ output: searchResults.slice(10, 20).map((result) => ({ ...result, markdown: `${result.title} policy updated in 2026.` })) }),
    jsonResponse({ output: searchResults.slice(20).map((result) => ({ ...result, markdown: `${result.title} policy updated in 2026.` })) }),
    jsonResponse({ output: { content: { signals: [] } } }),
  ];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return responses.shift();
  };

  const result = await runYouComScan({ domain: "example.com", apiKey: "test-key", fetchImpl });
  const contentsCalls = calls.filter((call) => call.url === "https://ydc-index.io/v1/contents");

  assert.deepEqual(contentsCalls.map((call) => call.body.urls.length), [10, 10, 5]);
  assert.equal(result.analyzedPageCount, 25);
  assert.match(result.apiTrace[1].detail, /^25 full pages extracted across 3 batches/);
  assert.match(calls.at(-1).body.input, /https:\/\/example\.com\/page-25/);
});

test("a completed live scan with no verified changes is still a successful result", async () => {
  const responses = [
    jsonResponse({ results: { web: [] } }),
    jsonResponse([{ url: "https://example.com", title: "Example", markdown: "Current content" }]),
    jsonResponse({ output: { content: { signals: [] } } }),
  ];

  const result = await runYouComScan({
    domain: "example.com",
    apiKey: "test-key",
    fetchImpl: async () => responses.shift(),
  });

  assert.deepEqual(result.signals, []);
  assert.match(result.apiTrace[3].detail, /^0 verified changes/);
});

test("surfaces an actionable credential error without exposing the key", async () => {
  await assert.rejects(
    runYouComScan({
      domain: "example.com",
      apiKey: "secret-value",
      fetchImpl: async () => jsonResponse({ message: "Unauthorized" }, 401),
    }),
    (error) => {
      assert.ok(error instanceof YouComScanError);
      assert.equal(error.stage, "Search");
      assert.equal(error.status, 401);
      assert.match(error.userMessage, /YDC_API_KEY/);
      assert.doesNotMatch(error.userMessage, /secret-value/);
      return true;
    },
  );
});
