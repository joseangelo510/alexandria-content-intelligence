from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "alexandria-one-pager.pdf"

PAPER = HexColor("#F5F1E8")
WHITE = HexColor("#FFFDF8")
INK = HexColor("#142A2D")
INK_2 = HexColor("#1B3739")
GOLD = HexColor("#D89B42")
TEAL = HexColor("#2E817A")
MUTED = HexColor("#667572")
LINE = HexColor("#D8D0C1")
TEAL_SOFT = HexColor("#DCEBE6")
GOLD_SOFT = HexColor("#F4E7CD")


def wrap_text(text, font_name, font_size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_text(c, text, x, y, width, font="Helvetica", size=8.5, leading=11, color=INK, max_lines=None):
    c.setFillColor(color)
    c.setFont(font, size)
    lines = wrap_text(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def label(c, text, x, y, color=TEAL):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 6.4)
    c.drawString(x, y, text.upper())


def rounded_box(c, x, y, w, h, fill, stroke=LINE, radius=7):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    page_w, page_h = landscape(letter)
    c = canvas.Canvas(str(OUTPUT), pagesize=(page_w, page_h))
    c.setTitle("Alexandria - Content Intelligence One-Pager")
    c.setAuthor("Jose")

    c.setFillColor(PAPER)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Header
    c.setFillColor(INK)
    c.rect(0, page_h - 78, page_w, 78, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.circle(42, page_h - 39, 18, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Times-Bold", 18)
    c.drawCentredString(42, page_h - 45, "A")
    c.setFillColor(WHITE)
    c.setFont("Times-Bold", 27)
    c.drawString(72, page_h - 37, "ALEXANDRIA")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(HexColor("#B8C6C2"))
    c.drawString(73, page_h - 53, "CONTENT INTELLIGENCE FOR WEBSITES THAT CANNOT AFFORD TO AGE")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(page_w - 34, page_h - 34, "FOUNDER: JOSE | SEO AGENCY OWNER")
    c.setFillColor(HexColor("#B8C6C2"))
    c.setFont("Helvetica", 7)
    c.drawRightString(page_w - 34, page_h - 50, "PUBLIC HACKATHON PRODUCT | JULY 2026")

    left_x = 34
    gap = 20
    left_w = 310
    right_x = left_x + left_w + gap
    right_w = page_w - right_x - 34
    top_y = page_h - 102

    # Left column: founder problem
    label(c, "The agency problem", left_x, top_y)
    y = top_y - 19
    y = draw_text(
        c,
        "I'm Jose. I own an SEO agency, and some of our clients have thousands of valuable web pages.",
        left_x,
        y,
        left_w,
        font="Times-Bold",
        size=16,
        leading=18.5,
        color=INK,
    )
    y -= 6
    y = draw_text(
        c,
        "One of our hardest jobs is keeping every statistic, deadline, policy, and recommendation aligned with what is true right now. The work is painfully manual, and inaccurate information still gets flagged before a team can find and fix it.",
        left_x,
        y,
        left_w,
        size=8.5,
        leading=11.4,
        color=MUTED,
    )
    y -= 4
    y = draw_text(
        c,
        "Even after we update a page, the world changes again. Doing this once is editing. Doing it continuously across thousands of pages is an intelligence problem.",
        left_x,
        y,
        left_w,
        font="Helvetica-Bold",
        size=8.2,
        leading=11,
        color=INK,
    )

    y -= 12
    pain_h = 46
    pains = [
        ("01", "CONTENT AT SCALE", "Manual audits are slow, expensive, and incomplete."),
        ("02", "ACCURACY RISK", "Outdated facts erode trust and trigger client escalations."),
        ("03", "PERPETUAL CHANGE", "A newly updated page can start aging again tomorrow."),
    ]
    for number, title, copy in pains:
        rounded_box(c, left_x, y - pain_h, left_w, pain_h, WHITE)
        c.setFillColor(GOLD)
        c.setFont("Times-Bold", 9)
        c.drawString(left_x + 12, y - 18, number)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 7.4)
        c.drawString(left_x + 42, y - 16, title)
        draw_text(c, copy, left_x + 42, y - 29, left_w - 55, size=7.2, leading=9, color=MUTED)
        y -= pain_h + 7

    quote_h = 66
    rounded_box(c, left_x, y - quote_h, left_w, quote_h, INK_2, stroke=INK_2)
    label(c, "The warning", left_x + 14, y - 17, color=GOLD)
    draw_text(
        c,
        "The first Alexandria burned. The modern one decays one outdated page at a time.",
        left_x + 14,
        y - 35,
        left_w - 28,
        font="Times-Bold",
        size=11.2,
        leading=13,
        color=WHITE,
    )

    # Right column: solution and architecture
    label(c, "The solution", right_x, top_y)
    y2 = top_y - 18
    y2 = draw_text(
        c,
        "Alexandria watches what changed, finds where it matters, and prepares cited replacement copy for human approval.",
        right_x,
        y2,
        right_w,
        font="Times-Bold",
        size=14.5,
        leading=17,
        color=INK,
    )

    y2 -= 10
    steps = [
        ("1", "ENTER", "A website domain"),
        ("2", "DISCOVER", "Priority pages and new sources"),
        ("3", "READ", "The complete live page"),
        ("4", "VERIFY", "Claims against current evidence"),
        ("5", "ACT", "Before/after content patch"),
    ]
    step_gap = 7
    step_w = (right_w - step_gap * 4) / 5
    for idx, (number, title, copy) in enumerate(steps):
        x = right_x + idx * (step_w + step_gap)
        rounded_box(c, x, y2 - 71, step_w, 71, WHITE)
        c.setFillColor(GOLD)
        c.circle(x + 13, y2 - 15, 7, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(x + 13, y2 - 17.5, number)
        c.setFont("Helvetica-Bold", 6.6)
        c.drawString(x + 7, y2 - 35, title)
        draw_text(c, copy, x + 7, y2 - 47, step_w - 14, size=6.2, leading=7.5, color=MUTED, max_lines=3)

    y2 -= 91
    label(c, "The You.com engine", right_x, y2)
    y2 -= 12
    api_gap = 8
    api_w = (right_w - api_gap * 2) / 3
    apis = [
        ("SEARCH API", "Discovers pages, news, and authoritative sources.", "DISCOVERY + FRESHNESS"),
        ("CONTENTS API", "Reads clean, current content from the live page.", "FULL PAGE EXTRACTION"),
        ("RESEARCH API", "Reasons, cross-checks, cites, and structures findings.", "VERIFICATION + CITATIONS"),
    ]
    for idx, (title, copy, tag) in enumerate(apis):
        x = right_x + idx * (api_w + api_gap)
        fill = TEAL_SOFT if idx == 2 else WHITE
        rounded_box(c, x, y2 - 85, api_w, 85, fill)
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 7.3)
        c.drawString(x + 10, y2 - 17, title)
        draw_text(c, copy, x + 10, y2 - 33, api_w - 20, size=7, leading=9, color=INK, max_lines=4)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 5.6)
        c.drawString(x + 10, y2 - 73, tag)

    y2 -= 105
    label(c, "What works now", right_x, y2)
    label(c, "Production roadmap", right_x + right_w / 2 + 5, y2)
    y2 -= 12
    box_gap = 10
    box_w = (right_w - box_gap) / 2
    rounded_box(c, right_x, y2 - 105, box_w, 105, WHITE)
    rounded_box(c, right_x + box_w + box_gap, y2 - 105, box_w, 105, GOLD_SOFT)
    now_items = [
        "Public interactive product",
        "Live priority scan with a valid API key",
        "Cited findings and severity",
        "Before/after patches with export",
    ]
    next_items = [
        "Server-side API access",
        "Sitemap batching for thousands of pages",
        "Persistent monitoring and alerts",
        "Draft-only CMS integrations",
    ]
    for i, item in enumerate(now_items):
        c.setFillColor(TEAL)
        c.circle(right_x + 12, y2 - 16 - i * 21, 2.3, fill=1, stroke=0)
        draw_text(c, item, right_x + 20, y2 - 19 - i * 21, box_w - 30, size=7, leading=8.5, color=INK, max_lines=2)
    second_x = right_x + box_w + box_gap
    for i, item in enumerate(next_items):
        c.setFillColor(GOLD)
        c.circle(second_x + 12, y2 - 16 - i * 21, 2.3, fill=1, stroke=0)
        draw_text(c, item, second_x + 20, y2 - 19 - i * 21, box_w - 30, size=7, leading=8.5, color=INK, max_lines=2)

    # Footer
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.2)
    c.line(34, 25, page_w - 34, 25)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(34, 11, "LIVE DEMO")
    c.setFillColor(TEAL)
    c.setFont("Helvetica", 7)
    c.drawString(78, 11, "alexandria-content-intelligence--jose529.replit.app")
    c.setFillColor(MUTED)
    c.drawRightString(page_w - 34, 11, "Next.js | React | TypeScript | Replit Autoscale")

    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
