from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame

PAGE_W, PAGE_H = A4
GOLD = colors.HexColor("#B8973A")
DARK = colors.HexColor("#1A1A1A")
MID  = colors.HexColor("#4A4A4A")
SAND = colors.HexColor("#F5F0E8")
LIGHT_GOLD = colors.HexColor("#EDE4CC")
WHITE = colors.white

MARGIN_L = 18*mm
MARGIN_R = 18*mm
MARGIN_T = 15*mm
MARGIN_B = 18*mm

OUTPUT = "/home/zeyada/Khalas/Anubis_Tours_David_Brawn_Cairo.pdf"


# ── Page decorations ──────────────────────────────────────────────────────────

def draw_page(canvas_obj, doc):
    canvas_obj.saveState()
    w, h = PAGE_W, PAGE_H

    # Sand background
    canvas_obj.setFillColor(SAND)
    canvas_obj.rect(0, 0, w, h, fill=1, stroke=0)

    # Gold header bar
    canvas_obj.setFillColor(GOLD)
    canvas_obj.rect(0, h - 38*mm, w, 38*mm, fill=1, stroke=0)

    # Dark footer bar
    canvas_obj.setFillColor(DARK)
    canvas_obj.rect(0, 0, w, 14*mm, fill=1, stroke=0)

    # Left accent stripe
    canvas_obj.setFillColor(colors.HexColor("#8B6914"))
    canvas_obj.rect(0, 0, 5*mm, h, fill=1, stroke=0)

    # Right accent stripe
    canvas_obj.rect(w - 5*mm, 0, 5*mm, h, fill=1, stroke=0)

    # Header: company name
    canvas_obj.setFillColor(DARK)
    canvas_obj.setFont("Times-Bold", 26)
    canvas_obj.drawCentredString(w / 2, h - 18*mm, "ANUBIS TOURS")

    # Header: tagline
    canvas_obj.setFillColor(DARK)
    canvas_obj.setFont("Times-Italic", 10)
    canvas_obj.drawCentredString(w / 2, h - 25*mm, "A One-Client Company  |  In Honour of Mr David Brawn")

    # Decorative gold line under header text
    canvas_obj.setStrokeColor(DARK)
    canvas_obj.setLineWidth(0.8)
    canvas_obj.line(25*mm, h - 29*mm, w - 25*mm, h - 29*mm)

    # Header sub-line
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(DARK)
    canvas_obj.drawCentredString(w / 2, h - 33.5*mm, "CAIRO & GIZA  |  7 – 11 JUNE 2026  |  PRIVATE ITINERARY")

    # Footer text
    canvas_obj.setFillColor(LIGHT_GOLD)
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.drawCentredString(w / 2, 5*mm, "Anubis Tours  |  Private & Confidential  |  Prepared exclusively for Mr David Brawn")

    # Page number
    canvas_obj.setFillColor(GOLD)
    canvas_obj.setFont("Helvetica-Bold", 7)
    canvas_obj.drawRightString(w - 7*mm, 5*mm, f"Page {doc.page}")

    canvas_obj.restoreState()


# ── Style helpers ─────────────────────────────────────────────────────────────

def styles_factory():
    base = getSampleStyleSheet()

    section_title = ParagraphStyle(
        "SectionTitle",
        fontName="Times-Bold",
        fontSize=13,
        textColor=GOLD,
        spaceBefore=6,
        spaceAfter=3,
        leading=16,
    )
    day_header = ParagraphStyle(
        "DayHeader",
        fontName="Times-Bold",
        fontSize=11,
        textColor=DARK,
        spaceBefore=4,
        spaceAfter=2,
        leading=14,
    )
    body = ParagraphStyle(
        "Body",
        fontName="Times-Roman",
        fontSize=9.5,
        textColor=MID,
        spaceAfter=5,
        leading=14,
        leftIndent=0,
    )
    body_bold = ParagraphStyle(
        "BodyBold",
        fontName="Times-Bold",
        fontSize=9.5,
        textColor=DARK,
        spaceAfter=3,
        leading=14,
    )
    note = ParagraphStyle(
        "Note",
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        textColor=colors.HexColor("#7A6230"),
        spaceAfter=4,
        leading=12,
        leftIndent=4,
    )
    label = ParagraphStyle(
        "Label",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        textColor=WHITE,
        leading=10,
    )
    checklist_item = ParagraphStyle(
        "ChecklistItem",
        fontName="Times-Roman",
        fontSize=9,
        textColor=MID,
        spaceAfter=3,
        leading=13,
        leftIndent=8,
    )
    return {
        "section_title": section_title,
        "day_header": day_header,
        "body": body,
        "body_bold": body_bold,
        "note": note,
        "label": label,
        "checklist": checklist_item,
    }


def day_badge(day_num, date_str, title_str, s):
    """Returns a coloured day-badge table row."""
    badge_data = [[
        Paragraph(f"DAY {day_num}", ParagraphStyle(
            "badge_num", fontName="Helvetica-Bold", fontSize=9,
            textColor=DARK, leading=11)),
        Paragraph(f"{date_str}  |  {title_str}", ParagraphStyle(
            "badge_title", fontName="Times-Bold", fontSize=10.5,
            textColor=DARK, leading=13)),
    ]]
    badge_table = Table(badge_data, colWidths=[20*mm, 130*mm])
    badge_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GOLD),
        ("BACKGROUND", (1, 0), (1, 0), LIGHT_GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 4),
        ("LEFTPADDING", (1, 0), (1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.6, GOLD),
    ]))
    return badge_table


def stop_block(time_str, place_str, body_text, note_text, s):
    """Returns a KeepTogether block for one itinerary stop."""
    elems = []
    # Time + place header
    header_data = [[
        Paragraph(time_str, ParagraphStyle(
            "time", fontName="Helvetica-Bold", fontSize=8,
            textColor=GOLD, leading=10)),
        Paragraph(place_str, s["body_bold"]),
    ]]
    hdr = Table(header_data, colWidths=[22*mm, 128*mm])
    hdr.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LINEAFTER", (0, 0), (0, 0), 0.5, GOLD),
    ]))
    elems.append(hdr)
    elems.append(Paragraph(body_text, s["body"]))
    if note_text:
        elems.append(Paragraph(f"<i>&#x2192; {note_text}</i>", s["note"]))
    elems.append(Spacer(1, 3))
    return KeepTogether(elems)


# ── Build document ─────────────────────────────────────────────────────────────

def build():
    doc = BaseDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=MARGIN_L + 5*mm,
        rightMargin=MARGIN_R + 5*mm,
        topMargin=MARGIN_T + 38*mm,
        bottomMargin=MARGIN_B + 14*mm,
    )
    frame = Frame(
        doc.leftMargin, doc.bottomMargin,
        PAGE_W - doc.leftMargin - doc.rightMargin,
        PAGE_H - doc.topMargin - doc.bottomMargin,
        id="main",
    )
    template = PageTemplate(id="main", frames=[frame], onPage=draw_page)
    doc.addPageTemplates([template])

    s = styles_factory()
    story = []

    # ── WELCOME NOTE ──────────────────────────────────────────────────────────
    story.append(Paragraph("A Personal Note", s["section_title"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=4))
    story.append(Paragraph(
        "David, welcome to Cairo. Everything that follows has been arranged "
        "just for you — private car and driver throughout, pre-booked entry to "
        "every site, and a table at the finest Egyptian restaurant in the "
        "Middle East. This city rewards those who arrive prepared. You are one "
        "of them. The rest is ancient history.",
        s["body"]
    ))
    story.append(Spacer(1, 4*mm))

    # ── OVERVIEW BOX ─────────────────────────────────────────────────────────
    overview_data = [
        ["Arrival", "Sunday 7 June  |  5:20 PM  |  Cairo International Airport"],
        ["Hotel", "Novotel Cairo El Borg, Gezira Island, Zamalek  |  Nile-view room requested"],
        ["Transport", "Private car and driver throughout the entire trip"],
        ["Departure", "Thursday 11 June  |  Confirm pick-up time with driver the night before"],
    ]
    ov_style = [
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Times-Roman"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GOLD),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GOLD, WHITE]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]
    ov_table = Table(overview_data, colWidths=[28*mm, 122*mm])
    ov_table.setStyle(TableStyle(ov_style))
    story.append(ov_table)
    story.append(Spacer(1, 5*mm))

    # ── DAY 1 ─────────────────────────────────────────────────────────────────
    story.append(day_badge(1, "Sunday 7 June", "Arrival — Nile, a Walk & First Dinner", s))
    story.append(Spacer(1, 3))

    story.append(stop_block(
        "6:30 PM", "Novotel Cairo El Borg  |  Check-In",
        "Your base for the trip is on Gezira Island, directly on the Nile. "
        "Request a Nile-view room at check-in. The rooftop terrace is worth a "
        "visit before dinner for your first look across the city.",
        None, s
    ))
    story.append(stop_block(
        "7:15 PM", "Mamsha Ahl Misr  |  Nile Promenade",
        "A gentle 45-minute walk along a beautifully maintained riverside "
        "promenade on the Nile Corniche. Flat, safe, and handsome at dusk. "
        "Good for stretching the legs after a long flight without any fuss. "
        "A 5-minute drive from the hotel.",
        None, s
    ))
    story.append(stop_block(
        "8:30 PM", "Zitouni  |  Four Seasons Nile Plaza  |  Dinner",
        "A strong opening night. Zitouni is one of Cairo's finest Egyptian "
        "restaurants, inside the Four Seasons on the Nile. The dining room is "
        "warm and elegant — wood furnishings, Persian-style arches, ornate "
        "chandeliers, and Nile views. Order the fattah with lamb, the "
        "molokhiya, and finish with Om Ali for dessert. Full wine list.",
        "Reservation required. Book via the Four Seasons website.", s
    ))
    story.append(Spacer(1, 3*mm))

    # ── DAY 2 ─────────────────────────────────────────────────────────────────
    story.append(day_badge(2, "Monday 8 June", "Giza — Pyramids, the World's #1 Restaurant & the Sound and Light Show", s))
    story.append(Spacer(1, 3))

    story.append(stop_block(
        "7:00 AM", "Pyramids of Giza & the Great Sphinx",
        "Arrive at opening. June in Cairo means 38 degrees by midday, so this "
        "is not negotiable. Your private Egyptologist guide meets you here. "
        "Have the driver loop first to the panorama plateau on the western "
        "edge of the site for the three-pyramid view before entering. Allow "
        "three hours. The Sphinx is as large and as ancient as it sounds.",
        "Book your Egyptologist guide in advance via Egypt Paradise Tours or "
        "Mayer Magdy on Viator. The difference is significant.", s
    ))
    story.append(stop_block(
        "10:30 AM", "Khufu's Restaurant  |  Breakfast / Lunch",
        "Just voted the Best Restaurant in the Middle East and North Africa "
        "2026 — and it sits within the Giza Plateau with a direct, "
        "unobstructed view of the Great Pyramid. Chef Mostafa Seif serves "
        "elevated New Egyptian Cuisine: four-course set menus built around "
        "classic flavours treated with modern technique. The terrace table "
        "with pyramid views is the one to request. This is a remarkable "
        "place to eat in a remarkable location.",
        "Book well in advance at khufus.com. Specifically request a terrace "
        "table. It fills up.", s
    ))
    story.append(stop_block(
        "12:30 PM", "The Grand Egyptian Museum (GEM)",
        "Two kilometres from Khufu's. The GEM fully opened in November 2025 "
        "and is now the largest archaeological museum on earth. Your "
        "Egyptologist guide continues here. Head straight to the Tutankhamun "
        "halls first — two dedicated rooms housing 5,000 artefacts including "
        "the 23-carat gold death mask. Then the Grand Hall, where an "
        "11-metre statue of Ramses II stands beneath a glass roof. "
        "Allow three to four hours minimum.",
        "Pre-book tickets at gem.eg before leaving Australia. No door sales. "
        "The museum receives up to 20,000 visitors daily.", s
    ))
    story.append(stop_block(
        "7:00 PM", "Sound and Light Show  |  Giza Pyramids",
        "Return to Giza for one of Cairo's genuinely memorable evenings. The "
        "Sphinx narrates the history of the pharaohs as the pyramids are "
        "illuminated with projected light and music. The show runs for about "
        "an hour. Book as a private experience — no coaches, just you and "
        "the guide.",
        "Book via Viator. Private transfer from the hotel included.", s
    ))
    story.append(Spacer(1, 3*mm))

    # ── DAY 3 ─────────────────────────────────────────────────────────────────
    story.append(day_badge(3, "Tuesday 9 June", "The Citadel, Bayt al-Suhaymi & A Classic Evening on the Nile", s))
    story.append(Spacer(1, 3))

    story.append(stop_block(
        "9:00 AM", "Mosque of Muhammad Ali  |  The Citadel",
        "Start at Cairo's most commanding viewpoint. The Citadel sits on a "
        "hill above the city and the Muhammad Ali Mosque — the alabaster "
        "mosque — is one of the most visually striking buildings in the "
        "country. Ottoman domes, twin minarets, and a cool, serene interior. "
        "The views from the Citadel walls take in the entire city. "
        "Dress modestly and remove shoes on entry.",
        None, s
    ))
    story.append(stop_block(
        "11:00 AM", "Bayt al-Suhaymi  |  Islamic Cairo",
        "For the woodwork. Bayt al-Suhaymi is a wealthy Ottoman merchant's "
        "house built between 1648 and 1796 — the finest example of its kind "
        "in Cairo. The mashrabiya screens (intricately carved latticework "
        "built from hundreds of turned wooden pieces) are extraordinary. "
        "There are also courtyard gardens, a traditional bath house, and "
        "formal reception rooms that have barely changed in 300 years. "
        "Buy tickets online in advance and ask for a guide from the house "
        "itself. Around 40 minutes, all at your own pace.",
        "Located on Al-Muizz Street. Buy e-tickets online before visiting.", s
    ))
    story.append(stop_block(
        "5:00 PM", "The Cairo Cellar  |  Zamalek",
        "A pre-dinner drink at Cairo's most classic bar. The Cairo Cellar "
        "has been in the basement of The President Hotel on Zamalek Island "
        "since the 1970s. Brick walls, vintage posters, warm dim light, "
        "cold Egyptian Stella lager or a proper spirit. Unpretentious, "
        "full of character, and exactly the right sort of place for a "
        "58-year-old Australian pilot on a Tuesday evening in Cairo. "
        "Opens at 4 PM. Reserve a table.",
        "Call +20 12 82175991 to book.", s
    ))
    story.append(stop_block(
        "7:00 PM", "Nile Maxim  |  Dinner Cruise",
        "The pier is in Zamalek, minutes from the Cellar. The Nile Maxim "
        "is Cairo's most celebrated luxury dinner cruise — two hours on the "
        "river with a set-menu dinner, belly dancing, a Tanoura whirling "
        "dervish show, and the Cairo skyline passing slowly in the dark. "
        "Back by 9:30 PM. Book as a private tour, not a shared group.",
        "Book via Viator or a local operator as a private experience. "
        "Departs 7 PM, returns approximately 9:30 PM.", s
    ))
    story.append(Spacer(1, 3*mm))

    # ── DAY 4 ─────────────────────────────────────────────────────────────────
    story.append(day_badge(4, "Wednesday 10 June", "Jewish Heritage, Royal Mummies & A Farewell at the Four Seasons", s))
    story.append(Spacer(1, 3))

    story.append(stop_block(
        "9:00 AM", "Ben Ezra Synagogue  |  Coptic Cairo",
        "Egypt's oldest synagogue, dating to 882 CE, in the ancient Fustat "
        "district of Old Cairo. The site is famous throughout the world for "
        "the Cairo Geniza — a hidden chamber discovered in the 19th century "
        "containing over 280,000 medieval Jewish manuscripts, now housed at "
        "Cambridge, Princeton, and Oxford. Local tradition holds that this "
        "is the spot where baby Moses was found in the Nile. The interior "
        "is beautiful: a carved central bimah in the Sephardic tradition and "
        "an ornate wooden Torah Ark. The Hanging Church and the Coptic Museum "
        "are steps away if time permits.",
        "Open Sunday to Thursday, 9 AM to 4 PM.", s
    ))
    story.append(stop_block(
        "10:30 AM", "National Museum of Egyptian Civilization (NMEC)",
        "This is where the royal mummies are. Not the GEM — a common "
        "mistake. The Royal Mummies Hall at NMEC holds 22 pharaohs, "
        "including Ramses II and Queen Hatshepsut, in a hushed, dimly lit "
        "hall that carries genuine weight. Photography is prohibited inside "
        "and staff enforce it. The rest of the museum covers Egyptian history "
        "from prehistory to the present in a beautifully designed building "
        "overlooking Ain el-Sira Lake. Allow 90 minutes minimum.",
        "Open daily 9 AM to 5 PM. Last entry 3 PM.", s
    ))
    story.append(stop_block(
        "6:30 PM", "The Bar  |  Four Seasons Cairo at Nile Plaza  |  Farewell Drinks",
        "The finest bar in Cairo by any measure. Art Deco design, panoramic "
        "Nile views, a full premium spirits selection, and cocktails made "
        "properly — a correctly stirred Old Fashioned or a clean Martini, "
        "with the river below. Start with a drink on the Upper Deck Lounge "
        "(the outdoor rooftop above the pool) for the sunset, then move "
        "downstairs for the evening. If dinner is needed, Zitouni is one "
        "floor away. Garden City, where the hotel sits, is one of Cairo's "
        "most elegant neighbourhoods.",
        "No reservation needed for the bar, but let the concierge know "
        "you are coming for the Upper Deck.", s
    ))
    story.append(Spacer(1, 3*mm))

    # ── PRE-TRIP BOOKING CHECKLIST ────────────────────────────────────────────
    story.append(Paragraph("Pre-Trip Booking Checklist", s["section_title"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=5))
    story.append(Paragraph(
        "Everything below needs to be arranged before departure. "
        "Some of these will not be available on the day.",
        s["body"]
    ))

    checklist = [
        ("GEM Tickets", "gem.eg  |  No door sales. Book well ahead."),
        ("Khufu's Restaurant", "khufus.com  |  Request a terrace table. Book at least one week ahead."),
        ("Zitouni (Day 1)", "fourseasons.com/caironp  |  Dinner reservation required."),
        ("Nile Maxim Cruise", "Viator or local operator  |  Book as a private tour."),
        ("Sound and Light Show", "Viator  |  Private transfer included."),
        ("Egyptologist Guide", "Egypt Paradise Tours or Mayer Magdy via Viator  |  Book in advance."),
        ("Cairo Cellar", "+20 12 82175991  |  Reserve a table for the early evening."),
        ("Bayt al-Suhaymi", "E-tickets online before visiting."),
    ]

    cl_data = [[
        Paragraph("ITEM", ParagraphStyle("cl_hdr", fontName="Helvetica-Bold",
                                          fontSize=7.5, textColor=WHITE, leading=10)),
        Paragraph("ACTION", ParagraphStyle("cl_hdr2", fontName="Helvetica-Bold",
                                            fontSize=7.5, textColor=WHITE, leading=10)),
    ]]
    for item, action in checklist:
        cl_data.append([
            Paragraph(item, s["body_bold"]),
            Paragraph(action, s["body"]),
        ])

    cl_style = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_GOLD, WHITE]),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    cl_table = Table(cl_data, colWidths=[52*mm, 98*mm])
    cl_table.setStyle(TableStyle(cl_style))
    story.append(cl_table)
    story.append(Spacer(1, 5*mm))

    # ── PRACTICAL NOTES ───────────────────────────────────────────────────────
    story.append(Paragraph("A Few Things Worth Knowing", s["section_title"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=5))

    practical = [
        ("Heat", "June is high summer. Expect 36 to 40 degrees by midday. Every outdoor site is scheduled for the morning. Hat and water are essential."),
        ("Alcohol", "The Novotel does not serve alcohol. The Four Seasons, Cairo Cellar, and Nile Maxim all do."),
        ("Dress", "Lightweight smart-casual throughout. Modest dress (covered shoulders and knees) is required at the Mosque and the Synagogue."),
        ("Currency", "Egyptian Pound. Most places accept cards but carry some cash for tips and smaller purchases."),
        ("Scams", "Ignore anyone at the Pyramids offering unsolicited help, free photos, or camel rides. Your driver and guide handle everything."),
        ("Photography", "Strictly prohibited in the Royal Mummies Hall at NMEC. No exceptions."),
    ]

    pr_data = []
    for title, detail in practical:
        pr_data.append([
            Paragraph(title, s["body_bold"]),
            Paragraph(detail, s["body"]),
        ])

    pr_style = [
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GOLD, WHITE]),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, GOLD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    pr_table = Table(pr_data, colWidths=[28*mm, 122*mm])
    pr_table.setStyle(TableStyle(pr_style))
    story.append(pr_table)
    story.append(Spacer(1, 6*mm))

    # ── CLOSING ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=6))
    story.append(Paragraph(
        "Anubis Tours wishes Mr David Brawn an exceptional journey. "
        "Cairo has been receiving travellers for five thousand years. "
        "It is very good at it.",
        ParagraphStyle("closing", fontName="Times-Italic", fontSize=9.5,
                       textColor=MID, leading=14, alignment=TA_CENTER)
    ))

    doc.build(story)
    print(f"PDF written to {OUTPUT}")


if __name__ == "__main__":
    build()