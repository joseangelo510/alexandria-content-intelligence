"use client";

import { useMemo, useState } from "react";

type Signal = {
  id: number;
  severity: "Critical" | "High" | "Medium";
  title: string;
  url: string;
  section: string;
  age: string;
  issue: string;
  oldClaim: string;
  proposedCopy: string;
  sourceName: string;
  sourceUrl: string;
  detected: string;
  confidence: number;
  status?: "Ready" | "Approved";
};

type ApiTrace = {
  api: "Search" | "Contents" | "LlamaIndex" | "Research";
  status: "complete" | "fallback";
  detail: string;
};

const initialSignals: Signal[] = [
  {
    id: 1,
    severity: "Critical",
    title: "How ChatGPT Can Help with College Applications",
    url: "empowerly.com/applications/how-chatgpt-can-help-with-college-applications/",
    section: "Application deadlines",
    age: "3.2 years",
    issue: "Several example university deadlines reference the 2020–21 application cycle.",
    oldClaim: "Cornell University: January 2, 2021 · UC Berkeley: November 30, 2020",
    proposedCopy:
      "Application deadlines change every cycle. Confirm each deadline on the university’s official admissions website before submitting. Last verified: July 24, 2026.",
    sourceName: "Empowerly page + current university admissions sources",
    sourceUrl:
      "https://empowerly.com/applications/how-chatgpt-can-help-with-college-applications/",
    detected: "4 minutes ago",
    confidence: 98,
    status: "Ready",
  },
  {
    id: 2,
    severity: "High",
    title: "SAT Test Dates and Registration Guide",
    url: "empowerly.com/college-admissions/sat-test-dates/",
    section: "2026–27 test calendar",
    age: "11 months",
    issue: "The new August 2026–June 2027 SAT calendar is now published and registration is open.",
    oldClaim: "The page currently emphasizes the previous testing calendar.",
    proposedCopy:
      "The 2026–27 SAT testing calendar begins August 22, 2026. Students should review every test date and registration deadline on the official College Board calendar before making a testing plan.",
    sourceName: "College Board — SAT Dates and Deadlines",
    sourceUrl: "https://satsuite.collegeboard.org/sat/dates-deadlines",
    detected: "18 minutes ago",
    confidence: 96,
    status: "Ready",
  },
  {
    id: 3,
    severity: "High",
    title: "Emory Class of 2028 Acceptance Rate",
    url: "empowerly.com/applications/acceptance-rates/emory-class-of-2028-acceptance-rate-14-5/",
    section: "Admissions statistics",
    age: "2.2 years",
    issue: "The article still presents Fall 2024 results as the latest admissions cycle.",
    oldClaim: "Emory’s 14.49% Class of 2028 acceptance rate is presented as the current benchmark.",
    proposedCopy:
      "Emory admitted 14.49% of applicants to the Class of 2028. This figure is historical and should not be read as the university’s current acceptance rate; compare class years using Emory’s latest published admission data.",
    sourceName: "Emory University — Undergraduate Admission",
    sourceUrl: "https://apply.emory.edu/discover/facts-stats/index.html",
    detected: "31 minutes ago",
    confidence: 92,
    status: "Ready",
  },
  {
    id: 4,
    severity: "Medium",
    title: "FAFSA Deadlines: What Families Need to Know",
    url: "empowerly.com/college-finance/fafsa-deadlines/",
    section: "Federal and state deadlines",
    age: "8 months",
    issue: "Federal Student Aid has published the complete 2026–27 deadline schedule.",
    oldClaim: "Deadlines are summarized without the newly published 2026–27 state schedule.",
    proposedCopy:
      "For the 2026–27 FAFSA cycle, families should check federal, state, and college deadlines separately. State and school priority deadlines may arrive substantially earlier than the federal deadline.",
    sourceName: "Federal Student Aid — 2026–27 FAFSA Deadlines",
    sourceUrl: "https://studentaid.gov/sites/default/files/2026-27-fafsa-form.pdf",
    detected: "1 hour ago",
    confidence: 94,
    status: "Ready",
  },
];

const scanSteps = [
  "Search is mapping the content library",
  "Contents is reading affected pages",
  "LlamaIndex is prioritizing long-page evidence",
  "Research is cross-checking claims",
  "Preparing cited content updates",
];

const howItWorks = [
  {
    number: "01",
    title: "Scan",
    copy: "Alexandria reads your live pages and finds the claims most likely to have gone out of date.",
  },
  {
    number: "02",
    title: "Verify",
    copy: "It cross-checks each claim against current authoritative sources and cites exactly what changed.",
  },
  {
    number: "03",
    title: "Review and fix",
    copy: "You see the old text beside ready-to-paste replacement copy, then decide what gets approved.",
  },
];

const ArrowIcon = () => <span aria-hidden="true">↗</span>;

function Seal() {
  return (
    <span className="brand-seal" aria-hidden="true">
      A
    </span>
  );
}

function sourceMonogram(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function Home() {
  const [domain, setDomain] = useState("empowerly.com");
  const [signals, setSignals] = useState(initialSignals);
  const [selected, setSelected] = useState<Signal | null>(null);
  const [filter, setFilter] = useState("All updates");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [apiTrace, setApiTrace] = useState<ApiTrace[]>([]);
  const [scanMode, setScanMode] = useState<"demo" | "live">("demo");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [scanError, setScanError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredSignals = useMemo(() => {
    if (filter === "All updates") return signals;
    if (filter === "Needs review") return signals.filter((signal) => signal.status !== "Approved");
    return signals.filter((signal) => signal.severity === filter);
  }, [filter, signals]);

  async function runScan() {
    if (!domain.trim() || scanning) return;
    setScanning(true);
    setScanComplete(false);
    setScanError("");
    setScanStep(0);

    for (let index = 0; index < scanSteps.length; index += 1) {
      setScanStep(index);
      await new Promise((resolve) => setTimeout(resolve, index === 0 ? 650 : 520));
    }

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, apiKey: apiKey.trim() || undefined }),
      });
      const payload = (await response.json()) as {
        signals?: Signal[];
        apiTrace?: ApiTrace[];
        mode?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "The scan could not be completed.");
      if (Array.isArray(payload.signals)) setSignals(payload.signals);
      if (payload.apiTrace?.length) setApiTrace(payload.apiTrace);
      setScanMode(payload.mode === "live-you-com" ? "live" : "demo");
      setScanComplete(true);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "The scan could not be completed.");
      setScanComplete(false);
    } finally {
      setScanning(false);
    }
  }

  function approveSignal(id: number) {
    setSignals((current) =>
      current.map((signal) => (signal.id === id ? { ...signal, status: "Approved" } : signal)),
    );
    setSelected((current) => (current?.id === id ? { ...current, status: "Approved" } : current));
  }

  async function copyUpdate(signal: Signal) {
    await navigator.clipboard.writeText(signal.proposedCopy);
    setCopiedId(signal.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  function contentPatch(signal: Signal) {
    return `# Alexandria content update\n\nPage: ${signal.title}\nURL: https://${signal.url}\nConfidence: ${signal.confidence}%\n\n## Before\n${signal.oldClaim}\n\n## After\n${signal.proposedCopy}\n\n## Why it changed\n${signal.issue}\n\n## Primary evidence\n${signal.sourceName}\n${signal.sourceUrl}\n`;
  }

  const approvedCount = signals.filter((signal) => signal.status === "Approved").length;
  const liveRun = scanMode === "live" && scanComplete;
  const analyzedCount = liveRun
    ? Number.parseInt(apiTrace.find((stage) => stage.api === "Contents")?.detail.match(/\d+/)?.[0] ?? `${signals.length}`, 10)
    : 2147;
  const averageConfidence = Math.round(signals.reduce((total, signal) => total + signal.confidence, 0) / Math.max(signals.length, 1));
  const pendingCount = signals.length - approvedCount;
  const workspaceName = liveRun ? domain.replace(/^www\./, "") : "Empowerly";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <Seal />
          <div>
            <strong>Alexandria</strong>
            <span>Content Intelligence</span>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          <a className="nav-item active" href="#library">
            <span className="nav-glyph">⌂</span> Scan
          </a>
          <a className="nav-item" href="#how-it-works">
            <span className="nav-glyph">↳</span> How It Works
          </a>
          <a className="nav-item" href="#patches">
            <span className="nav-glyph">◉</span> Findings
            <span className="nav-count">{signals.length}</span>
          </a>
          <a className="nav-item" href="#sources">
            <span className="nav-glyph">≡</span> Sources
          </a>
          <a className="nav-item" href="#problem">
            <span className="nav-glyph">✦</span> Why Alexandria
          </a>
        </nav>

        <div className="sidebar-note">
          <span className="eyebrow">THE PRINCIPLE</span>
          <p>The moment the world changes, knowledge begins to age.</p>
        </div>

        <div className="workspace-chip">
          <span className="workspace-avatar">{workspaceName.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{workspaceName}</strong>
            <span>{liveRun ? "Live priority scan" : "Demo workspace"}</span>
          </div>
          <span aria-hidden="true">⌄</span>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="live-status">
            <span className="live-dot" /> {liveRun ? `Live scan · ${workspaceName}` : "Ready to scan"}
          </div>
          <div className="topbar-actions">
            <span className="powered-pill">Powered by <strong>You.com</strong></span>
            <button className="icon-button" aria-label="Notifications">◎</button>
            <span className="user-avatar">JG</span>
          </div>
        </header>

        <div className="content-wrap">
          <section className="hero" id="library">
            <div className="hero-copy">
              <span className="eyebrow">KEEP YOUR CONTENT TRUE</span>
              <h1>Don’t let your resource library decay like Alexandria.</h1>
              <p>
                Alexandria scans your website and finds pages with outdated information—old
                statistics, newly issued guidelines, and other changes your content has not caught
                up with—then gives your editors cited, ready-to-paste corrections. Built for
                resource libraries with thousands or tens of thousands of pages, it makes accurate
                content at scale manageable.
              </p>
              <p className="hero-platform">
                Nothing publishes without a human. Your team keeps control of every update.
              </p>
            </div>

            <div className="scan-card">
              <label htmlFor="domain">Enter a website to scan</label>
              <div className="domain-input-wrap">
                <span aria-hidden="true">◎</span>
                <input
                  id="domain"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && runScan()}
                  aria-label="Website domain"
                />
                <button onClick={runScan} disabled={scanning}>
                  {scanning ? "Scanning…" : "Scan my site"}
                  {!scanning && <ArrowIcon />}
                </button>
              </div>
              <div className="scan-meta">
                <span><span className="mini-dot green" /> {liveRun ? `${analyzedCount} priority pages analyzed` : "2,147 pages in the Empowerly sample"}</span>
                <span>{liveRun ? "Live scan · just now" : "Sample snapshot · July 24, 2026"}</span>
              </div>
              <p className="scan-helper">
                We’ll read up to 25 priority pages and show what changed. Try the sample now, or
                add your You.com key to scan another site.
              </p>
              <button className="api-key-toggle" type="button" onClick={() => setShowApiKey((current) => !current)}>
                {showApiKey ? "Hide API key" : "Use my You.com key"} <span>{showApiKey ? "−" : "+"}</span>
              </button>
              {showApiKey && (
                <div className="api-key-field">
                  <label htmlFor="api-key">You.com API key</label>
                  <input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    autoComplete="off"
                    placeholder="Paste for this scan only"
                  />
                  <small>Used only for this request. Alexandria does not save it in the browser.</small>
                </div>
              )}
            </div>
          </section>

          <section className="how-it-works" id="how-it-works" aria-labelledby="how-it-works-title">
            <div className="how-intro">
              <span className="eyebrow">HOW IT WORKS</span>
              <h2 id="how-it-works-title">Three steps from stale to accurate.</h2>
              <p>Alexandria turns a sprawling content audit into a focused editorial queue—without publishing over your team.</p>
              <div className="review-promise">
                <span aria-hidden="true">✓</span>
                <p><strong>Human-reviewed by design.</strong> Every suggestion includes source evidence and waits for your approval.</p>
              </div>
            </div>
            <ol className="workflow-list">
              {howItWorks.map((step) => (
                <li key={step.number}>
                  <span className="step-number"><small>STEP</small>{step.number}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {(scanning || scanComplete) && (
            <section className={`scan-progress ${scanComplete ? "complete" : ""}`} aria-live="polite">
              <div className="progress-head">
                <div>
                  <span className="pulse-ring" />
                  <strong>{scanComplete ? "Website scan complete" : scanSteps[scanStep]}</strong>
                </div>
                <span>{scanComplete ? `${signals.length} verified ${signals.length === 1 ? "change" : "changes"}` : `${scanStep + 1} of ${scanSteps.length}`}</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${scanComplete ? 100 : ((scanStep + 1) / scanSteps.length) * 100}%` }} />
              </div>
              {scanComplete && apiTrace.length > 0 && (
                <div className="trace-row">
                  {apiTrace.map((stage) => (
                    <span key={stage.api}>
                      <b>{stage.api} ✓</b> {stage.detail}
                    </span>
                  ))}
                  <em>{scanMode === "live" ? "Live You.com run" : "Evidence-backed demo run"}</em>
                </div>
              )}
            </section>
          )}

          {scanError && (
            <section className="scan-error" role="alert">
              <div><strong>Live scan not completed</strong><p>{scanError}</p></div>
              <button onClick={() => setShowApiKey(true)}>Add API key</button>
            </section>
          )}

          <section className="metrics" aria-label="Content health metrics">
            <article className="metric-card dark">
              <div className="metric-top"><span>{liveRun ? "Average confidence" : "Content health score"}</span><span className="trend up">{liveRun ? "LIVE" : "SAMPLE"}</span></div>
              <strong>{liveRun ? averageConfidence : 84}<span>{liveRun ? "%" : "/100"}</span></strong>
              <div className="vitality-bar"><span style={{ width: `${liveRun ? averageConfidence : 84}%` }} /></div>
              <p>{liveRun ? `${signals.length} cited findings in this priority scan.` : "Strong authority, with 187 pages needing attention."}</p>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>{liveRun ? "Pages analyzed" : "Pages monitored"}</span>{liveRun ? <span className="metric-icon">▤</span> : <span className="trend">SAMPLE</span>}</div>
              <strong>{analyzedCount.toLocaleString()}</strong>
              <p>{liveRun ? "Priority pages read live" : <><b>1,960</b> currently verified in the sample</>}</p>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Pages needing updates</span>{liveRun ? <span className="metric-icon amber">≈</span> : <span className="trend">SAMPLE</span>}</div>
              <strong>{liveRun ? signals.length : 187}</strong>
              <p><b>{signals.filter((signal) => signal.severity !== "Medium").length}</b> high-impact findings{liveRun ? "" : " in this sample"}</p>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>{liveRun ? "Review queue" : "Time reclaimed"}</span>{liveRun ? <span className="metric-icon teal">◷</span> : <span className="trend">SAMPLE</span>}</div>
              <strong>{liveRun ? pendingCount : "43h"}</strong>
              <p>{liveRun ? "Content updates awaiting approval" : "Estimated for this sample month"}</p>
            </article>
          </section>

          <section className="workspace-grid">
            <div className="queue-panel" id="patches">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">UPDATES TO REVIEW</span>
                  <h2>Updates to review</h2>
                </div>
                <button className="text-button">View all {liveRun ? signals.length : 187} updates <ArrowIcon /></button>
              </div>

              <div className="filter-row" role="group" aria-label="Filter signals">
                {["All updates", "Critical", "High", "Needs review"].map((item) => (
                  <button
                    key={item}
                    className={filter === item ? "active" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="signal-list">
                {liveRun && filteredSignals.length === 0 && (
                  <div className="empty-state">
                    <strong>No verified outdated content found</strong>
                    <p>The live You.com scan completed successfully. No high-confidence content changes need review in this priority sample.</p>
                  </div>
                )}
                {filteredSignals.map((signal) => (
                  <button className="signal-row" key={signal.id} onClick={() => setSelected(signal)}>
                    <span className={`severity ${signal.severity.toLowerCase()}`}>{signal.severity}</span>
                    <span className="signal-main">
                      <strong>{signal.title}</strong>
                      <span>{signal.issue}</span>
                      <small>{signal.url}</small>
                    </span>
                    <span className="signal-meta">
                      <small>Facts last verified</small>
                      <strong>{signal.age}</strong>
                    </span>
                    <span className={`status-mark ${signal.status === "Approved" ? "approved" : ""}`}>
                      {signal.status === "Approved" ? "✓" : "→"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <aside className="signal-panel" id="lighthouse">
              <div className="lighthouse-orbit" aria-hidden="true">
                <span className="orbit one" />
                <span className="orbit two" />
                <span className="beam" />
                <span className="tower">A</span>
              </div>
              <span className="eyebrow light">VERIFIED SOURCES</span>
              <h2>What changed, with proof.</h2>
              <p>{liveRun ? `Alexandria found ${signals.length} cited changes across ${analyzedCount} priority pages.` : "Alexandria found 4 authoritative changes connected to 32 high-impact pages."}</p>
              <div className="source-stack" id="sources">
                {signals.slice(0, 3).map((signal) => (
                  <a href={signal.sourceUrl} target="_blank" rel="noreferrer" key={signal.id}>
                    <span>{sourceMonogram(signal.sourceName)}</span>
                    <div><strong>{signal.sourceName}</strong><small>{signal.issue}</small></div>
                    <ArrowIcon />
                  </a>
                ))}
              </div>
              <div className="human-note">
                <span>Human approval required</span>
                <p>Alexandria never publishes a factual change without an editor.</p>
              </div>
            </aside>
          </section>

          <section className="closing-statement" aria-label="The Alexandria warning">
            <span className="eyebrow">KEEP YOUR LIBRARY CURRENT</span>
            <strong>The Library of Alexandria was lost all at once. A modern resource library decays one outdated page at a time.</strong>
            <div className="closing-actions">
              <a href="/alexandria-one-pager.pdf" target="_blank" rel="noreferrer">
                Download one-pager <ArrowIcon />
              </a>
              <a href="/alexandria-project-requirements.md" target="_blank" rel="noreferrer">
                View project requirements <ArrowIcon />
              </a>
            </div>
          </section>

          <section className="founder-problem" id="problem">
            <div className="founder-story">
              <span className="eyebrow light">WHY WE BUILT ALEXANDRIA</span>
              <h2>I’m Jose. I run an SEO agency, and outdated content is one of the hardest problems to solve at scale.</h2>
              <p>
                Some of our clients have thousands of valuable pages. Keeping every statistic,
                deadline, policy, and recommendation accurate is painfully manual, and teams can
                still get flagged for information they did not know had changed.
              </p>
              <p>
                Even after an editor updates a page, new data or guidance can make it stale again.
                Doing this once is editing. Doing it continuously across thousands of pages is an
                intelligence problem—and that is the problem Alexandria was built to solve.
              </p>
              <div className="founder-signature">
                <span>JG</span>
                <div><strong>Jose</strong><small>SEO agency owner · Alexandria builder</small></div>
              </div>
            </div>

            <div className="problem-stack" aria-label="Problems Alexandria solves">
              <article>
                <span>01</span>
                <div><strong>Too many pages</strong><p>Manual audits become slow, expensive, and incomplete as a resource library grows.</p></div>
              </article>
              <article>
                <span>02</span>
                <div><strong>Facts change quietly</strong><p>Deadlines, policies, prices, and statistics can become wrong without warning.</p></div>
              </article>
              <article>
                <span>03</span>
                <div><strong>Trust is at risk</strong><p>Outdated information weakens authority and creates avoidable client escalations.</p></div>
              </article>
              <article className="solution-card">
                <span>✦</span>
                <div><strong>Alexandria keeps watch</strong><p>It finds what changed and prepares cited replacement copy for human review.</p></div>
              </article>
            </div>
          </section>

          <footer className="evidence-footer" aria-label="Alexandria technology partners">
            <div className="evidence-footer-copy">
              <span className="eyebrow">LIVE EVIDENCE PIPELINE</span>
              <strong>Fresh sources in. Cited updates out.</strong>
              <p>Alexandria combines live web intelligence, structured retrieval, and cloud hosting to keep every scan current and reviewable.</p>
            </div>
            <div className="evidence-partners">
              <div>
                <span>01</span>
                <strong>You.com</strong>
                <small>Search API · Contents API · Research API</small>
              </div>
              <div>
                <span>02</span>
                <strong>LlamaIndex</strong>
                <small>Evidence retrieval and prioritization</small>
              </div>
              <div>
                <span>03</span>
                <strong>Replit</strong>
                <small>Application hosting and deployment</small>
              </div>
            </div>
          </footer>
        </div>
      </section>

      {selected && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <aside
            className="detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="brand-lockup compact"><Seal /><span>Alexandria brief</span></div>
              <button className="close-button" onClick={() => setSelected(null)} aria-label="Close detail">×</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-badges">
                <span className={`severity ${selected.severity.toLowerCase()}`}>{selected.severity}</span>
                <span className="confidence">{selected.confidence}% confidence</span>
              </div>
              <h2 id="drawer-title">{selected.title}</h2>
              <a className="drawer-url" href={`https://${selected.url}`} target="_blank" rel="noreferrer">
                {selected.url} <ArrowIcon />
              </a>

              <div className="evidence-timeline">
                <div className="timeline-item">
                  <span>1</span>
                  <div><small>CLAIM FOUND</small><strong>{selected.section}</strong><p>{selected.oldClaim}</p></div>
                </div>
                <div className="timeline-item">
                  <span>2</span>
                  <div><small>CHANGE VERIFIED</small><strong>{selected.issue}</strong><p>Detected {selected.detected} and cross-checked against an authoritative source.</p></div>
                </div>
                <div className="timeline-item proposed">
                  <span>3</span>
                  <div><small>PROPOSED CONTENT UPDATE</small><strong>Editor-ready recommendation</strong><p>{selected.proposedCopy}</p></div>
                </div>
              </div>

              <section className="before-after" aria-label="Before and after content comparison">
                <div className="comparison-heading">
                  <div><span className="eyebrow">CONTENT UPDATE</span><h3>Before and after</h3></div>
                  <span>Human-reviewed change</span>
                </div>
                <div className="comparison-grid">
                  <article className="before-card">
                    <small>BEFORE · CURRENT PAGE</small>
                    <p>{selected.oldClaim}</p>
                  </article>
                  <article className="after-card">
                    <small>AFTER · PROPOSED COPY</small>
                    <p>{selected.proposedCopy}</p>
                  </article>
                </div>
                <div className="patch-actions">
                  <button onClick={() => copyUpdate(selected)}>{copiedId === selected.id ? "Copied ✓" : "Copy after text"}</button>
                  <a
                    href={`data:text/markdown;charset=utf-8,${encodeURIComponent(contentPatch(selected))}`}
                    download={`alexandria-content-update-${selected.id}.md`}
                  >
                    Download content update
                  </a>
                </div>
              </section>

              <div className="source-proof">
                <span className="source-monogram">✓</span>
                <div><small>PRIMARY EVIDENCE</small><a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceName} <ArrowIcon /></a></div>
              </div>
            </div>
            <div className="drawer-footer">
              <p>Approval marks the update ready. Publishing still requires an authenticated CMS connection.</p>
              <div>
                <button className="secondary-button" onClick={() => setSelected(null)}>Keep for review</button>
                <button
                  className={`approve-button ${selected.status === "Approved" ? "approved" : ""}`}
                  onClick={() => approveSignal(selected.id)}
                >
                  {selected.status === "Approved" ? "Content update approved ✓" : "Approve content update"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
