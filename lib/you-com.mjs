import { Document, SentenceSplitter } from "llamaindex";

const SEARCH_ENDPOINT = "https://ydc-index.io/v1/search";
const CONTENTS_ENDPOINT = "https://ydc-index.io/v1/contents";
const RESEARCH_ENDPOINT = "https://api.you.com/v1/research";
const MAX_SCAN_PAGES = 25;
const CONTENTS_BATCH_SIZE = 10;
const MAX_EVIDENCE_CHARS_PER_PAGE = 650;

export class YouComScanError extends Error {
  /**
   * @param {"Search" | "Contents" | "Research"} stage
   * @param {number | undefined} status
   * @param {string} message
   */
  constructor(stage, status, message) {
    super(message);
    this.name = "YouComScanError";
    this.stage = stage;
    this.status = status;
  }

  get userMessage() {
    if (this.status === 401 || this.status === 403) {
      return "You.com rejected the API key. Update YDC_API_KEY in Replit Secrets and republish the deployment.";
    }
    if (this.status === 429) {
      return "The You.com API rate limit was reached. Wait briefly, then run the scan again.";
    }
    return `${this.stage} could not complete the live scan. Please try again.`;
  }
}

/** @param {unknown} value */
export function normalizeDomain(value) {
  if (typeof value !== "string") return "";
  const candidate = value.trim().slice(0, 500);
  if (!candidate) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    if (!url.hostname || !url.hostname.includes(".")) return "";
    return url.hostname.toLowerCase().replace(/\.$/, "").slice(0, 180);
  } catch {
    return "";
  }
}

/** @param {unknown} value */
function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** @param {unknown} value @param {number} maxLength */
function clippedText(value, maxLength) {
  return asText(value).slice(0, maxLength);
}

/** @param {string} url @param {string} domain */
function isOnDomain(url, domain) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const expected = domain.toLowerCase().replace(/^www\./, "");
    return hostname === expected || hostname.endsWith(`.${expected}`);
  } catch {
    return false;
  }
}

/** @param {unknown} value */
function parseResearchContent(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};

  const withoutFence = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(withoutFence);
  } catch {
    return {};
  }
}

const volatilityPattern = /\b(20\d{2}|deadline|admission|acceptance|price|cost|fee|policy|require|eligib|rate|statistic|percent|regulation|schedule|date|tuition|rank|latest|current|guideline|standard|version|feature|availability|location|hours|leadership)\b|%/gi;
const volatilityLocatorPattern = new RegExp(volatilityPattern.source, "i");

/** @param {unknown} value */
function evidenceExcerpt(value) {
  const text = asText(value);
  if (text.length <= MAX_EVIDENCE_CHARS_PER_PAGE) return text;
  const matchIndex = text.search(volatilityLocatorPattern);
  const start = matchIndex < 0
    ? 0
    : Math.max(0, matchIndex - Math.floor(MAX_EVIDENCE_CHARS_PER_PAGE * 0.3));
  return text.slice(start, start + MAX_EVIDENCE_CHARS_PER_PAGE);
}

/**
 * Uses LlamaIndex to preserve evidence from across long pages instead of
 * sending only the opening characters to the research stage.
 * @param {Array<Record<string, unknown>>} pages
 */
export function indexPageEvidence(pages) {
  const splitter = new SentenceSplitter({ chunkSize: 600, chunkOverlap: 80 });
  const allChunks = [];

  pages.slice(0, MAX_SCAN_PAGES).forEach((page, pageIndex) => {
    const markdown = asText(page?.markdown);
    if (!markdown) return;

    const document = new Document({
      text: markdown,
      metadata: {
        pageIndex,
        title: asText(page?.title) || `Page ${pageIndex + 1}`,
        url: asText(page?.url),
      },
    });

    const nodes = splitter.getNodesFromDocuments([document]);
    nodes.forEach((node, chunkIndex) => {
      const text = node.getText().trim();
      const volatilityMatches = text.match(volatilityPattern)?.length ?? 0;
      allChunks.push({
        pageIndex,
        chunkIndex,
        title: document.metadata.title,
        url: document.metadata.url,
        text,
        score: volatilityMatches * 10 + (chunkIndex === 0 ? 4 : 0),
      });
    });
  });

  const bestByPage = new Map();
  for (const chunk of allChunks) {
    const current = bestByPage.get(chunk.pageIndex);
    if (!current || chunk.score > current.score) bestByPage.set(chunk.pageIndex, chunk);
  }

  const selected = [...bestByPage.values()].sort((a, b) => a.pageIndex - b.pageIndex);
  const text = selected
    .map((chunk, index) =>
      `EVIDENCE ${index + 1}: ${clippedText(chunk.title, 100)}\nURL: ${clippedText(chunk.url, 260)}\nCONTENT:\n${evidenceExcerpt(chunk.text)}`,
    )
    .join("\n\n---\n\n");

  return { text, chunkCount: allChunks.length, selectedCount: selected.length };
}

/**
 * @param {unknown} value
 * @param {number} index
 */
function normalizeSignal(value, index) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const signal = /** @type {Record<string, unknown>} */ (value);
  const severity = ["Critical", "High", "Medium"].includes(asText(signal.severity))
    ? asText(signal.severity)
    : "Medium";
  const confidence = Number(signal.confidence);
  const confidencePercent = confidence >= 0 && confidence <= 1 ? confidence * 100 : confidence;
  const url = asText(signal.url);
  const sourceUrl = asText(signal.sourceUrl);

  if (
    !asText(signal.title) ||
    !url ||
    !asText(signal.issue) ||
    !asText(signal.oldClaim) ||
    !asText(signal.proposedCopy) ||
    !asText(signal.sourceName) ||
    !sourceUrl
  ) {
    return null;
  }

  return {
    id: index + 1,
    severity,
    title: asText(signal.title),
    url: url.replace(/^https?:\/\//i, ""),
    section: asText(signal.section) || "Page content",
    age: "Verify now",
    issue: asText(signal.issue),
    oldClaim: asText(signal.oldClaim),
    proposedCopy: asText(signal.proposedCopy),
    sourceName: asText(signal.sourceName),
    sourceUrl,
    detected: "just now",
    confidence: Number.isFinite(confidencePercent)
      ? Math.max(0, Math.min(100, Math.round(confidencePercent)))
      : 80,
    status: "Ready",
  };
}

/**
 * @param {"Search" | "Contents" | "Research"} stage
 * @param {string} endpoint
 * @param {RequestInit} init
 * @param {number} timeoutMs
 * @param {typeof fetch} fetchImpl
 */
async function fetchJson(stage, endpoint, init, timeoutMs, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(endpoint, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    throw new YouComScanError(stage, undefined, error instanceof Error ? error.message : "Network error");
  }

  if (!response.ok) {
    throw new YouComScanError(stage, response.status, `${stage} returned ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new YouComScanError(stage, response.status, `${stage} returned invalid JSON`);
  }
}

/**
 * Runs the real Search -> Contents -> Research workflow.
 * @param {{domain: string, apiKey: string, fetchImpl?: typeof fetch}} options
 */
export async function runYouComScan({ domain, apiKey, fetchImpl = fetch }) {
  const headers = { "Content-Type": "application/json", "X-API-Key": apiKey };
  const apiTrace = [];

  const searchData = await fetchJson(
    "Search",
    SEARCH_ENDPOINT,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `site:${domain} statistics guidelines standards policies pricing requirements latest current`,
        count: MAX_SCAN_PAGES,
        safesearch: "moderate",
        country: "US",
      }),
    },
    15_000,
    fetchImpl,
  );

  const searchResults = Array.isArray(searchData?.results?.web) ? searchData.results.web : [];
  const candidateUrls = [...new Set(
    searchResults
      .map((result) => asText(result?.url))
      .filter((url) => url.startsWith("http") && isOnDomain(url, domain)),
  )].slice(0, MAX_SCAN_PAGES);
  apiTrace.push({ api: "Search", status: "complete", detail: `${candidateUrls.length} candidate pages mapped` });

  const urlsToRead = candidateUrls.length ? candidateUrls : [`https://${domain}`];
  const contentBatches = [];
  for (let index = 0; index < urlsToRead.length; index += CONTENTS_BATCH_SIZE) {
    contentBatches.push(urlsToRead.slice(index, index + CONTENTS_BATCH_SIZE));
  }
  const contentsResponses = await Promise.all(contentBatches.map((urls) => fetchJson(
    "Contents",
    CONTENTS_ENDPOINT,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        urls,
        formats: ["markdown", "metadata"],
        crawl_timeout: 20,
      }),
    },
    45_000,
    fetchImpl,
  )));

  const pages = contentsResponses.flatMap((contentsData) => Array.isArray(contentsData)
    ? contentsData
    : Array.isArray(contentsData?.output)
      ? contentsData.output
      : []);
  const readablePages = pages.filter((page) => asText(page?.markdown));
  apiTrace.push({
    api: "Contents",
    status: "complete",
    detail: `${readablePages.length} full pages extracted across ${contentBatches.length} ${contentBatches.length === 1 ? "batch" : "batches"}`,
  });

  const inventory = searchResults
    .slice(0, MAX_SCAN_PAGES)
    .map((result, index) =>
      `${index + 1}. ${clippedText(result?.title, 80)}\nURL: ${clippedText(result?.url, 180)}\nSearch evidence: ${clippedText(asText(result?.description) || (Array.isArray(result?.snippets) ? result.snippets.join(" ") : ""), 100)}`,
    )
    .join("\n\n");
  const indexedEvidence = indexPageEvidence(readablePages);
  const pageEvidence = indexedEvidence.text;
  apiTrace.push({
    api: "LlamaIndex",
    status: "complete",
    detail: `${indexedEvidence.chunkCount} evidence chunks indexed; ${indexedEvidence.selectedCount} prioritized`,
  });

  const researchPrompt = `You are the reasoning engine for Alexandria, a content intelligence system. Audit ${domain} for truth drift: statements that were once accurate but are now stale because authoritative information changed.

You.com Search discovered this inventory:
${inventory || "No indexed inventory was returned; inspect the extracted homepage evidence."}

You.com Contents extracted these live pages:
${pageEvidence || "No full-page markdown was available. Use search evidence conservatively and return zero findings rather than guessing."}

Cross-check time-sensitive information, statistics, standards, policies, pricing, requirements, and guidelines against the latest authoritative primary sources. For every finding, identify the exact affected URL and stale claim, explain what changed, cite the strongest source, and write concise editor-ready replacement copy. The proposedCopy field must contain text an editor can paste into the page, not instructions about what to write. Never invent an affected URL or claim. Return no more than 25 high-confidence findings, with at most one finding per affected page; returning zero is correct when no verified truth drift exists.`;

  const researchData = await fetchJson(
    "Research",
    RESEARCH_ENDPOINT,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        input: researchPrompt.slice(0, 39_500),
        research_effort: "standard",
        output_schema: {
          type: "object",
          properties: {
            signals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  section: { type: "string" },
                  issue: { type: "string" },
                  oldClaim: { type: "string" },
                  proposedCopy: { type: "string" },
                  sourceName: { type: "string" },
                  sourceUrl: { type: "string" },
                  severity: { type: "string", enum: ["Critical", "High", "Medium"] },
                  confidence: { type: "number" },
                },
                required: ["title", "url", "section", "issue", "oldClaim", "proposedCopy", "sourceName", "sourceUrl", "severity", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["signals"],
          additionalProperties: false,
        },
      }),
    },
    90_000,
    fetchImpl,
  );

  const content = parseResearchContent(researchData?.output?.content);
  const rawSignals = Array.isArray(content?.signals) ? content.signals : [];
  const signals = rawSignals.map(normalizeSignal).filter(Boolean);
  apiTrace.push({ api: "Research", status: "complete", detail: `${signals.length} verified changes found` });

  return { mode: "live-you-com", domain, analyzedPageCount: readablePages.length, signals, apiTrace };
}
