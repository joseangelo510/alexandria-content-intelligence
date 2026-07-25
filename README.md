# Alexandria

Content intelligence for websites that cannot afford to age.

**Public product:** https://alexandria-content-intelligence--jose529.replit.app

**Fallback demo:** https://alexandria-intelligence.joseangelo.chatgpt.site

Alexandria detects truth drift across website content, verifies what changed using live authoritative sources, and prepares cited before-and-after content patches for human approval.

> The first Alexandria burned. The modern one decays one outdated page at a time.

## Why we built it

Jose owns an SEO agency whose clients can have thousands of valuable pages. Keeping every statistic, deadline, policy, and recommendation current is painfully manual. Even after a page is updated, new data or guidance can make it stale again.

Doing this once is editing. Doing it continuously across thousands of pages is an intelligence problem.

## How Alexandria works

1. **You.com Search API** discovers priority pages and current authoritative sources.
2. **You.com Contents API** extracts clean content from the live affected pages.
3. **LlamaIndex** chunks long pages and prioritizes evidence about dates, policies, prices, statistics, and other volatile claims.
4. **You.com Research API** cross-checks claims, reasons over changes, and returns structured cited findings.
5. **Alexandria** prioritizes risk and presents current copy beside editor-ready replacement copy.
6. **A human editor** approves, copies, or downloads the content patch.

## Current capabilities

- Evidence-backed Empowerly sample
- Live priority-page scans with a valid You.com API key
- LlamaIndex evidence chunking for long pages
- Structured findings with severity and confidence
- Primary-source evidence
- Before-and-after content comparisons
- Copy and Markdown patch export
- Public responsive interface

## Current boundaries

- The public deployment keeps the You.com API key in Replit Secrets; it is never shipped to the browser.
- A live scan currently reads up to 25 priority pages; it is not yet a full sitemap crawl.
- Approval does not write to a CMS. Draft-only CMS adapters are part of the production roadmap.
- Scan history and scheduled monitoring are not yet persisted.

## Stack

- You.com Search API
- You.com Contents API
- You.com Research API
- LlamaIndex.TS
- Next.js
- React
- TypeScript
- Replit Autoscale (primary public deployment)
- Vinext and Cloudflare Workers via Sites (fallback deployment)

## Project materials

- [One-pager source](docs/ALEXANDRIA_ONE_PAGER.md)
- [One-pager PDF](output/pdf/alexandria-one-pager.pdf)
- [Project requirements and submission checklist](docs/ALEXANDRIA_PROJECT_REQUIREMENTS.md)
- [Official hackathon guide reviewed for this project](https://45321510.fs1.hubspotusercontent-na1.net/hubfs/45321510/YDC_hackathon_track_11142025.pdf)

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `YDC_API_KEY` in `.env.local` to run live scans without entering a key in the interface.

## Validation

```bash
npm run build
npm run build:replit
npm run lint
npm test
```
