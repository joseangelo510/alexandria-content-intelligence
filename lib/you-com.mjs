import { Document, SentenceSplitter } from "llamaindex";

const SEARCH_ENDPOINT = "https://ydc-index.io/v1/search";
const CONTENTS_ENDPOINT = "https://ydc-index.io/v1/contents";
const RESEARCH_ENDPOINT = "https://api.you.com/v1/research";

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

const volatilityPattern = /\b(20\d{2}|deadline|admission|acceptance|price|cost|fee|policy|require|eligib|rate|statistic|percent|regulation|schedule|date|tuition|rank|latest|current)\b|%/gi;

/**
 * Uses LlamaIndex to preserve evidence from across long pages instead of
 * sending only the opening characters to the research stage.
 * @param {Array<Record<string, unknown>>} pages
 */
export function indexPageEvidence(pages) {
  const splitter = new SentenceSplitter({ chunkSize: 600, chunkOverlap: 80 });
  const allChunks = [];

  pages.slice(0, 6).forEach((page, pageIndex) => {
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

  const selected = [];
  const selectedKeys = new Set();
  const firstByPage = new Map();
  allChunks.forEach((chunk) => {
    if (!firstByPage.has(chunk.pageIndex)) firstByPage.set(chunk.pageIndex, chunk);
  });

  for (const chunk of firstByPage.values()) {
    selected.push(chunk);
    selectedKeys.add(`${chunk.pageIndex}:${chunk.chunkIndex}`);
  }

  for (const chunk of [...allChunks].sort((a, b) => b.score - a.score || a.pageIndex - b.pageIndex || a.chunkIndex - b.chunkIndex)) {
    const key = `${chunk.pageIndex}:${chunk.chunkIndex}`;
    if (selected.length >= 12) break;
    if (!selectedKeys.has(key)) {
      selected.push(chunk);
      selectedKeys.add(key);
    }
  }

  selected.sort((a, b) => a.pageIndex - b.pageIndex || a.chunkIndex - b.chunkIndex);
  const text = selected
    .map((chunk, index) =>
      `EVIDENCE CHUNK ${index + 1}: ${chunk.title}\nURL: ${chunk.url}\nCURRENT PAGE CONTENT:\n${chunk.text}`,
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
        query: `site:${domain} dates statistics requirements policies deadlines pricing latest guide`,
        count: 8,
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
  )].slice(0, 6);
  apiTrace.push({ api: "Search", status: "complete", detail: `${candidateUrls.length} candidate pages mapped` });

  const urlsToRead = candidateUrls.length ? candidateUrls : [`https://${domain}`];
  const contentsData = await fetchJson(
    "Contents",
    CONTENTS_ENDPOINT,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        urls: urlsToRead,
        formats: ["markdown", "metadata"],
        crawl_timeout: 12,
      }),
    },
    25_000,
    fetchImpl,
  );

  const pages = Array.isArray(contentsData)
    ? contentsData
    : Array.isArray(contentsData?.output)
      ? contentsData.output
      : [];
  const readablePages = pages.filter((page) => asText(page?.markdown));
  apiTrace.push({ api: "Contents", status: "complete", detail: `${readablePages.length} full pages extracted` });

  const inventory = searchResults
    .slice(0, 8)
    .map((result, index) =>
      `${index + 1}. ${asText(result?.title)}\nURL: ${asText(result?.url)}\nSearch evidence: ${asText(result?.description) || (Array.isArray(result?.snippets) ? result.snippets.join(" ").slice(0, 800) : "")}`,
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

Cross-check dates, statistics, policies, requirements, pricing, regulations, and deadlines against the latest authoritative primary sources. For every finding, identify the exact affected URL and stale claim, explain what changed, cite the strongest source, and write concise editor-ready replacement copy. The proposedCopy field must contain text an editor can paste into the page, not instructions about what to write. Never invent an affected URL or claim. Return no more than six high-confidence findings; returning zero is correct when no verified truth drift exists.`;

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

  return { mode: "live-you-com", domain, signals, apiTrace };
}
