import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain, runYouComScan, YouComScanError } from "@/lib/you-com.mjs";

type ApiTrace = {
  api: "Search" | "Contents" | "LlamaIndex" | "Research";
  status: "complete" | "fallback";
  detail: string;
};

const demoSignals = [
  {
    id: 1,
    severity: "Critical",
    title: "How ChatGPT Can Help with College Applications",
    url: "empowerly.com/applications/how-chatgpt-can-help-with-college-applications/",
    section: "Application deadlines",
    age: "3.2 years",
    issue: "Several example university deadlines reference the 2020–21 application cycle.",
    oldClaim: "Cornell University: January 2, 2021 · UC Berkeley: November 30, 2020",
    proposedCopy: "Application deadlines change every cycle. Confirm each deadline on the university’s official admissions website before submitting. Last verified: July 24, 2026.",
    sourceName: "Empowerly page + current university admissions sources",
    sourceUrl: "https://empowerly.com/applications/how-chatgpt-can-help-with-college-applications/",
    detected: "just now",
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
    proposedCopy: "The 2026–27 SAT testing calendar begins August 22, 2026. Students should review every test date and registration deadline on the official College Board calendar before making a testing plan.",
    sourceName: "College Board — SAT Dates and Deadlines",
    sourceUrl: "https://satsuite.collegeboard.org/sat/dates-deadlines",
    detected: "just now",
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
    proposedCopy: "Emory admitted 14.49% of applicants to the Class of 2028. This figure is historical and should not be read as the university’s current acceptance rate; compare class years using Emory’s latest published admission data.",
    sourceName: "Emory University — Undergraduate Admission",
    sourceUrl: "https://apply.emory.edu/discover/facts-stats/index.html",
    detected: "just now",
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
    proposedCopy: "For the 2026–27 FAFSA cycle, families should check federal, state, and college deadlines separately. State and school priority deadlines may arrive substantially earlier than the federal deadline.",
    sourceName: "Federal Student Aid — 2026–27 FAFSA Deadlines",
    sourceUrl: "https://studentaid.gov/sites/default/files/2026-27-fafsa-form.pdf",
    detected: "just now",
    confidence: 94,
    status: "Ready",
  },
] as const;

const demoTrace: ApiTrace[] = [
  { api: "Search", status: "fallback", detail: "6 candidate pages mapped" },
  { api: "Contents", status: "fallback", detail: "4 full pages extracted" },
  { api: "Research", status: "fallback", detail: "4 claims cross-checked" },
];

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { domain?: string; apiKey?: string };
  const domain = normalizeDomain(body.domain);
  if (!domain) return NextResponse.json({ error: "A domain is required." }, { status: 400 });

  const sessionApiKey = typeof body.apiKey === "string" ? body.apiKey.trim().slice(0, 500) : "";
  const apiKey = process.env.YDC_API_KEY || sessionApiKey;
  if (!apiKey) {
    if (domain !== "empowerly.com" && domain !== "www.empowerly.com") {
      return NextResponse.json(
        {
          error: "Live You.com access is not configured. Add a You.com API key for this scan, or use empowerly.com to explore the evidence-backed example.",
          needsApiKey: true,
        },
        { status: 503 },
      );
    }
    return NextResponse.json({
      mode: "curated-demo",
      domain,
      signals: demoSignals,
      apiTrace: demoTrace,
    });
  }

  try {
    return NextResponse.json(await runYouComScan({ domain, apiKey }));
  } catch (error) {
    console.error("Alexandria scan fell back to curated evidence", error);
    if (domain === "empowerly.com" || domain === "www.empowerly.com") {
      return NextResponse.json({
        mode: "curated-fallback",
        domain,
        signals: demoSignals,
        apiTrace: demoTrace,
      });
    }
    const message = error instanceof YouComScanError
      ? error.userMessage
      : "The live scan could not be completed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
