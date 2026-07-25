# Alexandria Project Requirements

## 1. Product objective

Build a content intelligence platform for publishers, SEO teams, and agencies that detects when factual website content becomes outdated, verifies what changed using live authoritative sources, and prepares cited replacement copy for human review.

Alexandria must help teams move from reactive, page-by-page cleanup toward continuous content accuracy at scale.

## 2. Founder and user context

Jose owns an SEO agency. Several clients have thousands of web pages containing statistics, deadlines, policies, requirements, recommendations, and other facts that change over time.

The recurring pain is not simply writing content. It is identifying which claims changed, locating every affected page, verifying the newest information, and updating those pages again whenever the world changes.

## 3. Primary users

1. SEO agency owners managing large client websites
2. In-house SEO managers
3. Editorial and content operations teams
4. Digital publishers with evergreen resource libraries
5. Universities and other organizations maintaining fact-heavy pages

## 4. Core user story

> As an SEO or content owner, I want Alexandria to identify outdated claims across my website, show me the strongest current evidence, and prepare accurate replacement copy so my team can update high-risk pages without manually auditing the entire library.

## 5. Current hackathon scope

### Functional requirements

| ID | Requirement | Current status |
|---|---|---|
| FR-01 | Accept a website domain as scan input | Implemented |
| FR-02 | Support an evidence-backed sample without fabricating results for unrelated domains | Implemented |
| FR-03 | Accept a You.com API key for a session-only live scan | Implemented |
| FR-04 | Use You.com Search to discover priority pages and relevant sources | Implemented |
| FR-05 | Use You.com Contents to extract the full current page | Implemented |
| FR-06 | Use LlamaIndex to chunk long pages and prioritize volatile evidence | Implemented |
| FR-07 | Use You.com Research for multi-step verification and structured findings | Implemented |
| FR-08 | Return the affected URL, stale claim, explanation, severity, confidence, and primary source | Implemented |
| FR-09 | Display current and proposed content in a before-and-after comparison | Implemented |
| FR-10 | Require human approval before treating a patch as accepted | Implemented |
| FR-11 | Let an editor copy or download the proposed content patch | Implemented |
| FR-12 | Show actual live-scan metrics instead of sample totals after a live run | Implemented |
| FR-13 | Publish a public judge-accessible product URL | Implemented |

### Non-functional requirements

- **Accuracy:** Findings must be grounded in retrieved page content and current cited sources.
- **Transparency:** The product must distinguish live results, evidence-backed demo results, and failures.
- **Security:** API keys must not be persisted in browser storage, source files, or client-visible environment configuration.
- **Editorial control:** Alexandria must never claim to publish a factual change without human approval.
- **Resilience:** The Empowerly sample remains usable when live API access is unavailable.
- **Accessibility:** Forms, dialogs, buttons, and status changes require accessible labels and responsive behavior.
- **Compatibility:** The primary application must build and run on the Node.js 22 runtime used by Replit Autoscale.

## 6. You.com architecture

```text
Website domain
    -> You.com Search API
       discovers priority pages and recent authoritative sources
    -> You.com Contents API
       extracts clean live page content
    -> LlamaIndex
       chunks long pages and prioritizes fact-dense evidence
    -> You.com Research API
       plans, cross-checks, reasons, cites, and returns structured findings
    -> Alexandria application layer
       prioritizes risk and produces before/after content patches
    -> Human editor
       approves, copies, downloads, or sends the patch to a future CMS adapter
```

### Why multiple APIs

- Search is optimized for discovery and freshness.
- Contents is optimized for reading known pages completely.
- LlamaIndex prevents important evidence near the middle or end of a long page from being lost to naive truncation.
- Research is optimized for multi-source reasoning, verification, citations, and structured output.
- Alexandria is the product layer that converts those capabilities into an editorial workflow.

## 7. Actual tools used

### Hackathon intelligence stack

- You.com Search API
- You.com Contents API
- You.com Research API
- LlamaIndex.TS

### Application stack

- Next.js
- React
- TypeScript
- Replit Autoscale

### Fallback deployment target

- Vinext
- Cloudflare Workers via Sites

### Partner platforms actually used

- Replit Autoscale for the public deployment and server-side secret management
- LlamaIndex.TS for document chunking and evidence prioritization

Parasail, CrewAI, Render, and other partner tools are not part of the current implementation and should not be selected on the form.

## 8. Current boundaries

These limitations must be stated honestly during judging:

1. A live run is a priority-page proof of concept, currently reading up to 25 pages rather than crawling an entire multi-thousand-page site.
2. Approval changes product state only. Alexandria does not yet write directly to a CMS.
3. Scan history is not persisted between sessions.
4. Scheduled monitoring, notifications, user accounts, and team workflows are roadmap capabilities.

## 9. Production requirements

### Scale and monitoring

- Parse XML sitemap indexes and child sitemaps.
- Queue pages in bounded asynchronous batches.
- Persist page fingerprints, extracted claims, sources, and verification timestamps.
- Re-scan high-volatility page types more frequently than stable pages.
- Detect both source changes and content-library impact.

### Publishing

- Add authenticated, draft-only CMS adapters.
- Start with the CMS used by the first production client.
- Require explicit editor approval for every generated patch.
- Store a reversible audit trail containing before text, after text, evidence, editor, and timestamp.
- Never auto-publish factual changes by default.

### Platform

- Add application authentication and multi-tenant workspaces.
- Add usage limits, caching, retries, and rate-limit handling.
- Add durable scan jobs, monitoring, and alerting.
- Add source allowlists for high-stakes content categories.

## 10. Hackathon alignment

The hackathon challenge asks builders to create an agent, application, or integration using one or more You.com APIs to deliver smarter, more reliable, and real-time results.

Alexandria aligns because it:

- Uses three You.com APIs in a purposeful sequence and LlamaIndex to preserve evidence from long pages.
- Solves a real agency and publisher problem.
- Uses live web data rather than relying on model memory.
- Produces cited, structured findings.
- Explains what changed and prepares an action.
- Keeps a human editor responsible for the final decision.

## 11. Judge demo sequence

1. Open the public Alexandria URL.
2. Introduce Jose and the thousands-of-pages agency problem.
3. Explain the historical Alexandria metaphor and truth decay.
4. Point to the Search -> Contents -> LlamaIndex -> Research architecture.
5. Run the Empowerly evidence-backed example or a live scan with a valid API key.
6. Open the highest-risk finding.
7. Show the stale claim, source evidence, and before/after patch.
8. Copy or download the patch and explain the draft-only CMS roadmap.
9. Close with: **The first Alexandria burned. The modern one decays one outdated page at a time.**

## 12. Submission checklist

- [x] Product name and one-line description
- [x] Founder-led problem statement
- [x] Public working URL
- [x] Purposeful You.com API integration
- [x] Evidence-backed demo data
- [x] Architecture explanation
- [x] Before-and-after action flow
- [x] One-page project overview
- [x] Project requirements and limitations
- [x] Server-side You.com API key configured
- [x] Second partner integration implemented with LlamaIndex
- [ ] Live end-to-end scan recorded for the demo video
- [x] Repository requirement confirmed: public GitHub repo with README and setup instructions
- [ ] Public GitHub repository created and pushed
- [ ] Final pitch video recorded
- [ ] Submission form completed before the event deadline
