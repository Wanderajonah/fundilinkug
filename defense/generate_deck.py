#!/usr/bin/env python3
"""Generate the FundiLink project-defense deck (16:9) with python-pptx."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ---------- palette ----------
NAVY = RGBColor(0x14, 0x2A, 0x3F)
TEAL = RGBColor(0x0F, 0x6B, 0x6B)
LIGHT = RGBColor(0xF2, 0xF6, 0xF9)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREY = RGBColor(0x55, 0x5F, 0x6E)
ACCENT = RGBColor(0xE8, 0xA8, 0x2C)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
SW, SH = prs.slide_width, prs.slide_height


def add_rect(slide, x, y, w, h, fill, line=None, line_w=None, shadow=False):
    from pptx.enum.shapes import MSO_SHAPE
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = line_w or Pt(1)
    shp.shadow.inherit = False
    return shp


def add_text(slide, x, y, w, h, text, size=18, bold=False, color=GREY,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font="Arial",
             line_spacing=1.0, space_after=6):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line_spacing
        p.space_after = Pt(space_after)
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.name = font
        r.font.color.rgb = color
    return tb


def bullet_slide(title, bullets):
    slide = prs.slides.add_slide(BLANK)
    add_rect(slide, 0, 0, SW, SH, LIGHT)
    add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
    add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
             title, size=30, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), SW - Inches(1.6), SH - Inches(1.9))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, b in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(10)
        p.line_spacing = 1.1
        r = p.add_run()
        r.text = ("•  " + b) if not b.startswith("\t") else "\t" + b[1:]
        r.font.size = Pt(20)
        r.font.name = "Arial"
        r.font.color.rgb = GREY
        if b.startswith("**"):
            r.font.bold = True
            r.font.color.rgb = NAVY
            r.text = b.strip("*")
    return slide


# ---------------- Slide 1: Title ----------------
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, NAVY)
add_rect(s, 0, Inches(4.55), SW, Inches(0.06), ACCENT)
add_text(s, Inches(1), Inches(2.0), SW - Inches(2), Inches(1.4),
         "FundiLink", size=60, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
add_text(s, Inches(1), Inches(3.1), SW - Inches(2), Inches(1.0),
         "An AI-assisted, location-based mobile marketplace connecting Ugandans "
         "to trusted local artisans (Fundis)", size=22, color=RGBColor(0xCF,0xE0,0xE8),
         align=PP_ALIGN.CENTER)
add_text(s, Inches(1), Inches(4.9), SW - Inches(2), Inches(1.0),
         "Project Defence  •  (Your Name)  •  Supervisor: (Name)",
         size=20, color=WHITE, align=PP_ALIGN.CENTER, bold=True)
add_text(s, Inches(1), Inches(6.3), SW - Inches(2), Inches(0.6),
         "Course / Department   |   Date", size=16, color=RGBColor(0x9F,0xB4,0xC4),
         align=PP_ALIGN.CENTER)

# ---------------- Slide 2: Agenda ----------------
agenda = [
    "Introduction & Problem",
    "Objectives",
    "Conceptual Framework",
    "System Architecture",
    "Core Algorithms",
    "Implementation & Tech Stack",
    "Demonstration",
    "Testing",
    "Limitations & Future Work",
    "Conclusion",
]
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "Agenda", size=30, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
col = 0
xo = [Inches(0.9), Inches(5.7), Inches(10.0)]
for i, item in enumerate(agenda):
    add_rect(slide, Inches(0.9 + (i % 3) * 4.0), Inches(1.6 + (i // 3) * 1.75),
             Inches(3.6), Inches(1.45), WHITE)
    add_text(slide, Inches(1.15 + (i % 3) * 4.0), Inches(1.75 + (i // 3) * 1.75),
             Inches(3.1), Inches(1.2), f"{i+1}", size=30, bold=True, color=TEAL)
    add_text(slide, Inches(2.0 + (i % 3) * 4.0), Inches(1.8 + (i // 3) * 1.75),
             Inches(2.4), Inches(1.2), item, size=18, bold=True, color=NAVY,
             anchor=MSO_ANCHOR.MIDDLE)

# ---------------- Slide 3: Problem ----------------
bullet_slide("1 | Introduction & Problem", [
    "**Ugandans struggle to find reliable artisans —** plumbers, electricians, carpenters, masons.",
    "Word-of-mouth is slow, unverifiable, and geographically limited.",
    "No way to compare reviews, quotes, proximity, or track a job once started.",
    "Wasted time, unpredictable costs, no accountability, no trust history.",
    "**Aim:** a transparent, digital bridge between customers and verified fundis.",
])

# ---------------- Slide 4: Objectives ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "2 | Objectives", size=30, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(slide, Inches(0.8), Inches(1.5), SW - Inches(1.6), Inches(0.9),
         "Develop FundiLink: a mobile platform connecting customers to verified, "
         "nearby fundis with transparent quotes and reviews.", size=20, bold=True, color=NAVY)
objs = [
    "Build a cross-platform mobile app (React Native / Expo).",
    "Design a REST API backend (Node.js / Express) with secure auth (JWT + OTP).",
    "Give customers a ranked, map-based browser to discover nearby fundis (customer keeps the choice).",
    "Support the full job lifecycle: quote → accept → work → complete → review.",
    "Maintain a trust layer whose reviews feed back into discovery rankings.",
    "(Assist) Lightweight AI assistant that guides unsure users to the right trade category.",
]
tb = slide.shapes.add_textbox(Inches(0.9), Inches(2.6), SW - Inches(1.8), Inches(4.4))
tf = tb.text_frame; tf.word_wrap = True
for i, o in enumerate(objs):
    add_rect(slide, Inches(0.9), Inches(2.7 + i * 0.68), Inches(0.5), Inches(0.5), TEAL)
    add_text(slide, Inches(1.0), Inches(2.72 + i * 0.68), Inches(0.4), Inches(0.45),
             str(i + 1), size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(1.6), Inches(3.6 + i * 0.68) - Inches(0.92), SW - Inches(2.6), Inches(0.6),
             o, size=18, color=GREY, anchor=MSO_ANCHOR.MIDDLE)

# ---------------- Slide 5a: Conceptual Framework — Core Discovery Loop ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "3a | Conceptual Framework — Core Discovery Loop", size=30, bold=True,
         color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(slide, Inches(0.8), Inches(1.35), SW - Inches(1.6), Inches(0.55),
         "Browsing first: the customer always drives the choice — AI and ranking are aids, never decision-makers.",
         size=18, bold=True, color=TEAL)

flow = [
    "Customer sets location → app shows nearby fundi count",
    "Customer picks a category (Plumber / Electrician / Carpenter / Painter) or searches / filters",
    "System shows nearby fundis, ranked by Score = 0.6·Rating + 0.4·Proximity (map + list)",
    "Customer compares profiles (rating, reviews, distance, verified) and picks one",
    "Job created for the chosen fundi → quote → accept → in-progress → completed",
    "Both parties review → rating feeds back into step 3",
]
for i, step in enumerate(flow):
    y = Inches(2.0 + i * 0.82)
    add_rect(slide, Inches(0.8), y, Inches(5.9), Inches(0.72), WHITE)
    add_rect(slide, Inches(0.8), y, Inches(0.72), Inches(0.72), TEAL)
    add_text(slide, Inches(0.8), y, Inches(0.72), Inches(0.72), str(i + 1),
             size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, Inches(1.7), y, Inches(4.9), Inches(0.72), step, size=14,
             color=GREY, anchor=MSO_ANCHOR.MIDDLE)

add_text(slide, Inches(7.0), Inches(2.0), Inches(5.5), Inches(0.4),
         "Role of AI (supporting only)", size=18, bold=True, color=NAVY)
add_rect(slide, Inches(7.0), Inches(2.45), Inches(5.55), Inches(2.1), WHITE)
add_text(slide, Inches(7.2), Inches(2.6), Inches(5.15), Inches(1.9),
         "AI is a concierge, not a dispatcher.\n\n"
         "• Identifies the trade from a description or photo\n"
         "• Points the user to the right Browse category\n"
         "• Browsing always takes over from there\n\n"
         "It never selects the fundi and is not the main discovery path.",
         size=14, color=GREY)
add_rect(slide, Inches(7.0), Inches(4.75), Inches(5.55), Inches(0.72), WHITE)
add_text(slide, Inches(7.2), Inches(4.75), Inches(5.15), Inches(0.72),
         "Actors:  Customer (browses & picks) · Fundi (quotes & works) · "
         "System (ranks, brokers, records trust)", size=14, color=GREY,
         anchor=MSO_ANCHOR.MIDDLE)
add_rect(slide, Inches(0.8), Inches(6.55), Inches(11.75), Inches(0.62), ACCENT)
add_text(slide, Inches(1.0), Inches(6.61), Inches(11.4), Inches(0.5),
         "The engine ranks; the customer chooses. AI helps find the right category — it never decides the fundi.",
         size=15, bold=True, color=NAVY, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

# ---------------- Slide 5b: Conceptual Framework — Rank, Choose, Trust ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "3b | Conceptual Framework — Rank, Choose, Trust", size=30, bold=True,
         color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(slide, Inches(0.8), Inches(1.35), SW - Inches(1.6), Inches(0.55),
         "Three interlocking sub-models power the Closed-Loop marketplace.",
         size=18, bold=True, color=TEAL)

rmodels = [
    ("Discovery & Ranking", "Orders the browse list; ranking aid only, never assigns",
     "Category · location · fundi rating"),
    ("Transaction", "Manages the job once the customer picks a fundi",
     "Job state · quote · acceptance · completion"),
    ("Trust", "Builds reputation history between jobs",
     "Reviews · ratings · completed jobs"),
]
cx, cw, gap = Inches(0.8), Inches(3.72), Inches(0.3)
for i, (t, d, inputs) in enumerate(rmodels):
    x = cx + i * (cw + gap)
    add_rect(slide, x, Inches(2.0), cw, Inches(1.85), TEAL)
    add_text(slide, x + Inches(0.25), Inches(2.12), cw - Inches(0.5), Inches(0.45),
             t, size=19, bold=True, color=WHITE)
    add_text(slide, x + Inches(0.25), Inches(2.62), cw - Inches(0.5), Inches(0.75),
             d, size=14, color=RGBColor(0xE2, 0xF0, 0xEE))
    add_rect(slide, x, Inches(3.85), cw, Inches(0.72), WHITE)
    add_text(slide, x + Inches(0.2), Inches(3.85), cw - Inches(0.4), Inches(0.72),
             "Inputs:  " + inputs, size=12.5, color=GREY, anchor=MSO_ANCHOR.MIDDLE)

add_rect(slide, Inches(0.8), Inches(4.9), Inches(11.75), Inches(0.72), NAVY)
add_text(slide, Inches(0.9), Inches(4.9), Inches(11.5), Inches(0.72),
         "Score = 0.6 × Rating  +  0.4 × Proximity     (rating 0–5; proximity normalised so closer = higher)",
         size=17, bold=True, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

add_text(slide, Inches(0.8), Inches(5.8), Inches(11.5), Inches(0.4),
         "Closed feedback loop", size=17, bold=True, color=NAVY)
add_rect(slide, Inches(0.8), Inches(6.2), Inches(11.75), Inches(0.55), ACCENT)
add_text(slide, Inches(1.0), Inches(6.2), Inches(11.4), Inches(0.55),
         "Review → Ranking Score → Better Position in Browse List → Chosen & Completed → New Review",
         size=14.5, bold=True, color=NAVY, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

# ---------------- Slide 6: Architecture ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "4 | System Architecture", size=30, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
rows = [
    ("Layer", "Technology", "What lives there"),
    ("Presentation", "React Native (Expo) mobile app", "Customer & fundi screens, maps, chat, reviews"),
    ("Application / API", "Node.js + Express (MVC)", "Auth, jobs, bookings, wallets, geocoding, middlewares"),
    ("Data & Services", "MongoDB · Google Maps · EgoSMS · AI classifier", "Users, jobs, reviews, wallets · location · SMS/OTP · NLP"),
]
tbl = slide.shapes.add_table(4, 3, Inches(0.7), Inches(1.8), Inches(11.9), Inches(4.2)).table
tbl.columns[0].width = Inches(2.6)
tbl.columns[1].width = Inches(4.3)
tbl.columns[2].width = Inches(5.0)
for r, (a, b, c) in enumerate(rows):
    for cw, txt in enumerate((a, b, c)):
        cell = tbl.cell(r, cw)
        cell.margin_top = Pt(6); cell.margin_bottom = Pt(6)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY if r == 0 else (WHITE if r % 2 else LIGHT)
        p = cell.text_frame.paragraphs[0]
        run = p.add_run(); run.text = txt
        run.font.size = Pt(17 if r == 0 else 16)
        run.font.bold = (r in (0,) ) or (cw == 0)
        run.font.color.rgb = WHITE if r == 0 else (NAVY if cw == 0 else GREY)
add_text(slide, Inches(0.7), Inches(6.2), SW - Inches(1.4), Inches(0.7),
         "Monorepo:  backend/  (MVC)   ·   mobile/  (app)   ·   web/   —  deployed on Render + EAS",
         size=16, color=GREY)

# ---------------- Slide 7: Algorithms ----------------
bullet_slide("5 | Core Algorithms", [
    "**Recommendation / Ranking Engine**\n\tScore = 0.6 × Rating + 0.4 × Proximity\n\tRating (0–5) · Proximity (distance normalised to 0–5, closer = higher)\n\tRanks the browse list; returns Top 5 (customer still chooses).",
    "**AI / NLP Assistant (supporting role)**\n\tProblem described or photo uploaded → bot identifies the trade (sink/leak → plumbing; socket/wire → electrical)\n\tThen guides the user to Browse → that category; browsing takes over. Never selects a fundi.",
    "**Geospatial Routing**\n\tHaversine distance + Google Geocoding for address ↔ coordinates, routes and ETA.",
])

# ---------------- Slide 8: Tech stack ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "6 | Implementation & Tech Stack", size=30, bold=True, color=WHITE,
         anchor=MSO_ANCHOR.MIDDLE)
stack = [
    ("React Native + Expo", "Cross-platform mobile, fast iteration, OTA updates"),
    ("Node.js + Express (MVC)", "Lightweight async backend with a clean structure"),
    ("MongoDB", "Flexible schema for users, jobs, reviews, wallets"),
    ("JWT + OTP (EgoSMS)", "Secure sessions and local phone verification"),
    ("react-native-maps + Google", "Nearby fundis, address ↔ coordinates, routes"),
    ("AI support assistant", "Concierge only — guides unsure users to the right trade category"),
]
for i, (t, d) in enumerate(stack):
    x = Inches(0.8 + (i % 2) * 5.9)
    y = Inches(1.6 + (i // 2) * 1.75)
    add_rect(slide, x, y, Inches(5.6), Inches(1.5), WHITE)
    add_rect(slide, x, y, Inches(0.12), Inches(1.5), TEAL)
    add_text(slide, x + Inches(0.35), y + Inches(0.15), Inches(5.1), Inches(0.5),
             t, size=18, bold=True, color=NAVY)
    add_text(slide, x + Inches(0.35), y + Inches(0.7), Inches(5.1), Inches(0.7),
             d, size=14, color=GREY)
add_text(slide, Inches(0.8), Inches(6.3), SW - Inches(1.6), Inches(0.7),
         "Key REST APIs: auth (register/login/OTP) · maps (geocode/reverse/nearby/route) · "
         "users · fundis · jobs · support assistant · reviews",
         size=15, color=TEAL)

# ---------------- Slide 10: Demo ----------------
bullet_slide("7 | Demonstration", [
    "**1.** Register / login via OTP (EgoSMS); set location → nearby count.",
    "**2.** Pick a category tile (e.g. Plumber) → ranked map/list with search + filters (available, verified, ≤5 km, ★4.5+).",
    "**3.** (Optional assist) Ask the assistant “my sink is leaking” → guides to Browse → Plumber.",
    "**4.** Customer browses profiles & picks a plumber → job → fundi quotes → customer accepts.",
    "**5.** Job progresses to completion; both parties review.",
    "**6.** Fundi’s rating updates → improves position next time (feedback loop).",
])

# ---------------- Slide 10: Testing ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "8 | Testing", size=30, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
tests = [("Unit", "Classifier accuracy, recommendation-score ordering, OTP logic"),
         ("API / Integration", "End-to-end tests for all REST endpoints (Postman + scripts)"),
         ("Mobile", "Manual device tests on Android, Expo Go"),
         ("End-to-End", "Register → find → quote → complete → review happy path"),
         ("Edge cases", "Low-confidence classification, no fundis in radius, expired OTP")]
for i, (t, d) in enumerate(tests):
    add_rect(slide, Inches(0.9), Inches(1.7 + i * 1.05), Inches(2.6), Inches(0.85), TEAL)
    add_text(slide, Inches(0.9), Inches(1.7 + i * 1.05), Inches(2.6), Inches(0.85),
             t, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, Inches(3.9), Inches(1.7 + i * 1.05), SW - Inches(4.8), Inches(0.85),
             d, size=17, color=GREY, anchor=MSO_ANCHOR.MIDDLE)
add_text(slide, Inches(0.9), Inches(7.0), SW - Inches(1.8), Inches(0.4),
         "Seed data included (e.g. amina@example.com / peter@fundi.com).",
         size=14, color=GREY)

# ---------------- Slide 11: Limitations & Future ----------------
slide = prs.slides.add_slide(BLANK)
add_rect(slide, 0, 0, SW, SH, LIGHT)
add_rect(slide, 0, 0, SW, Inches(1.15), NAVY)
add_text(slide, Inches(0.6), Inches(0.22), SW - Inches(1.2), Inches(0.7),
         "9 | Limitations & Future Work", size=30, bold=True, color=WHITE,
         anchor=MSO_ANCHOR.MIDDLE)
lim = [
    "Rule-based classifier may misclassify unusual phrasing.",
    "Prototype scope: single currency, limited categories.",
    "Trust depends on motivated users posting reviews.",
]
fut = [
    "Fine-tuned / LLM classifier; multi-language (Luganda, Swahili).",
    "In-app escrow + real mobile money (MTN MoMo, Airtel Money).",
    "More categories; fundi credential & background verification.",
    "Offline mode, admin analytics dashboard, recency-weighted ratings.",
]
add_text(slide, Inches(0.9), Inches(1.5), Inches(5.5), Inches(0.5),
         "Limitations", size=22, bold=True, color=ACCENT)
tb = slide.shapes.add_textbox(Inches(0.9), Inches(2.1), Inches(5.5), Inches(3.5))
tf = tb.text_frame; tf.word_wrap = True
for b in lim:
    p = tf.paragraphs[0] if tf.paragraphs[0].runs else tf.add_paragraph()
    p.space_after = Pt(10); p.line_spacing = 1.1
    r = p.add_run(); r.text = "•  " + b
    r.font.size = Pt(17); r.font.color.rgb = GREY; r.font.name = "Arial"
add_text(slide, Inches(6.9), Inches(1.5), Inches(5.5), Inches(0.5),
         "Future Work", size=22, bold=True, color=TEAL)
tb = slide.shapes.add_textbox(Inches(6.9), Inches(2.1), Inches(5.6), Inches(3.9))
tf = tb.text_frame; tf.word_wrap = True
for b in fut:
    p = tf.paragraphs[0] if tf.paragraphs[0].runs else tf.add_paragraph()
    p.space_after = Pt(10); p.line_spacing = 1.1
    r = p.add_run(); r.text = "•  " + b
    r.font.size = Pt(17); r.font.color.rgb = GREY; r.font.name = "Arial"

# ---------------- Slide 12: Conclusion ----------------
bullet_slide("10 | Conclusion", [
    "FundiLink validates the concept end-to-end: an AI-assisted, location-based, trust-driven marketplace for artisan services.",
    "The closed-loop framework works: **better reviews → better rankings → better outcomes.**",
    "Architecture + APIs + app provide a solid foundation for a production marketplace in Uganda.",
    "**THANK YOU — Questions?**",
])

out = "/home/shell/pahappa/fundilinkug/defense/FundiLink_Defence.pptx"
prs.save(out)
print("Saved:", out)