# Alexandria Hackathon Submission Packet

Prepared July 24, 2026. This is a copy-and-paste packet for the live Google Form. Do not submit until the public GitHub URL and Jose's video URL are added.

## Submission status

### Ready

- Working product name, positioning, and approximately 200-word description
- Real-Time Intelligence track selection
- You.com Search, Contents, and Research API explanation
- Public Replit demo URL
- Public GitHub repository URL
- README with setup instructions
- Replit partner usage
- LlamaIndex partner integration for long-page evidence chunking (implemented and tested locally)
- All local tests, lint, and production builds passing

### Still required

- Primary contact email
- Republish the tested LlamaIndex build to the public Replit deployment
- Demo video URL (Jose is producing this)
- Final submission before the deadline

The official terms say submissions close at **6:00 PM Pacific**, while the current Luma agenda says **6:25 PM**. Treat **6:00 PM Pacific** as the safe deadline.

## Exact Google Form responses

### Email

`[JOSE'S GOOGLE ACCOUNT EMAIL]`

The form requires sign-in and also asks for a primary contact email separately.

### Full Name

`Jose Gallegos`

### Primary contact email

`[JOSE'S BEST CONTACT EMAIL]`

### Project name

`Alexandria`

### Team Details (name, members name + email, include yourself)

If Jose is the only builder:

`Jose Gallegos — [EMAIL]`

### Team size

Select: `1`

### Track

Select: `Real-Time Intelligence`

Alexandria reasons over continuously changing website information, which directly matches this track's description.

### Which You.com Stack did you use?

Select:

- `Search API`
- `Research API`
- `Other` → `Contents API`

Do not select MCP, Finance Research API, Plugins / Skills, or SDKs; they are not in the implementation.

### Project description (~200 words)

Alexandria is a content intelligence platform for publishers, SEO teams, and agencies managing thousands of pages that quietly become inaccurate. Jose runs an SEO agency and sees the problem firsthand: statistics, deadlines, policies, pricing, and recommendations change constantly, while manually finding and updating every affected page is slow, expensive, and impossible to sustain at scale.

Alexandria accepts any website domain and runs a live evidence pipeline. You.com Search maps priority pages and discovers current sources. You.com Contents reads the full live pages. LlamaIndex chunks long documents and prioritizes passages containing volatile claims, so important evidence is not lost near the middle or end of a page. You.com Research then cross-checks those claims against current authoritative sources and returns structured, cited findings.

The product ranks each issue by severity and confidence, shows the outdated claim beside editor-ready replacement copy, links to the strongest evidence, and requires human approval. Editors can copy or download a Markdown content patch for their existing workflow.

The working Replit deployment demonstrates a real Search-to-Contents-to-Research scan, not a simulated chatbot. The hackathon proof of concept audits six priority pages per run; production would expand this into sitemap-scale monitoring, persisted history, scheduled rescans, and authenticated draft-only CMS integrations.

### How did you use You.com APIs and platform? Explain in detail.

Alexandria uses three You.com endpoints as a purposeful factual-verification pipeline. First, the Search API queries the submitted domain to discover up to six high-priority pages containing dates, statistics, requirements, policies, deadlines, pricing, and other time-sensitive claims. Second, the Contents API extracts clean Markdown and metadata from those exact live URLs so the system evaluates the page itself rather than relying on snippets. LlamaIndex then splits long pages into sentence-aware chunks and prioritizes evidence likely to contain volatile facts. Finally, the Research API receives the search inventory and selected live-page evidence, performs multi-source cross-checking against current authoritative sources, and returns a strict structured schema containing the affected URL, old claim, explanation, proposed replacement copy, severity, confidence, source name, and source URL. Alexandria converts that output into a human-review workflow with before/after comparison, citations, approval state, copy, and patch download. The You.com key is stored server-side in Replit Secrets and is never exposed to the browser.

### Which partner platforms did you build on?

Select only:

- `Replit`
- `LlamaIndex`

Select LlamaIndex only after the local partner build has been pushed to the public repository and republished to Replit.

Partner explanation if asked:

`Replit hosts the public Next.js deployment and protects the server-side You.com secret. LlamaIndex.TS sentence-chunks long web pages and prioritizes fact-dense evidence before You.com Research verifies it.`

### Frameworks, SDKs & models used

Select `LlamaIndex` and `Other`.

Other response:

`Next.js 16, React 19, TypeScript, Node.js 22, LlamaIndex.TS 0.12.1, Replit Autoscale, and You.com Search, Contents, and Research APIs.`

Do not select OpenAI SDK, Claude SDK, Vercel AI SDK, CrewAI, LangGraph, or AutoGen.

### Public GitHub repo URL

`https://github.com/joseangelo510/alexandria-content-intelligence`

The repository must be public and include the existing README and setup instructions. A Replit project URL is not a substitute for this required field.

### Demo video URL (1–3 min)

`[JOSE'S VIDEO URL — REQUIRED]`

### Live demo URL

`https://alexandria-content-intelligence--jose529.replit.app`

### Confirmations

Select after the GitHub repository is public:

- `Project was built during the hackathon`
- `GitHub repository is public with a README`
- `Project used at least one You.com endpoint / MCP/ Plugin`

Leave `Other` blank.

## Partner decision

The formal judging criteria do not award points for partner count. They score innovation (25%), technical implementation (25%), impact and relevance (20%), user experience (15%), and presentation/documentation (15%).

Replit and LlamaIndex are the strongest honest combination:

- Replit is already the real hosting and secrets platform.
- LlamaIndex fixes a genuine technical weakness: naive leading-character truncation could miss an outdated fact later on a long page.

Do not add another partner merely for a logo. Parasail would require another secret and a second inference pass that currently duplicates You.com Research. Render would duplicate Replit hosting. CrewAI, Agno, and MindStudio would force an unnecessary architecture rewrite. Opsera is relevant only if deliberately pursuing its special award with a meaningful Agents or Forge workflow.

## Rules and judge alignment

- Uses at least one You.com endpoint: yes, three.
- Public GitHub with README and setup instructions: published.
- Live in-person demo plus 1–3 minute backup video: live app ready; video pending.
- Approximately 200-word description covering problem, track, stack, and API usage: ready.
- Built during the hackathon: confirm if accurate.
- Primary track: Real-Time Intelligence.
- Strong handbook fit: creativity + reasoning + real data; understand, cite, and act.
- Handbook recommendation followed: Search + Contents + Agents/Research-style reasoning.

## Final pre-submit check

1. Add primary email and team details.
2. Paste the public GitHub repository URL into the form.
3. Add the finished 1–3 minute video URL.
4. Republish the LlamaIndex build to Replit.
5. Open the live Replit app in an incognito window and run one final scan.
6. Confirm the repo README includes setup instructions and no secrets.
7. Submit by 6:00 PM Pacific to avoid the deadline conflict.
